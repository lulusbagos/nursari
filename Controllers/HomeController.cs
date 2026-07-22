using System.Diagnostics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nursari.Models;

namespace Nursari.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly NurseryContext _context;

        public HomeController(ILogger<HomeController> logger, NurseryContext context)
        {
            _logger = logger;
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var model = new DashboardViewModel();

            // 1. Core KPIs
            model.TotalSeedlings = await _context.Inventories.SumAsync(i => i.CurrentQuantity);
            model.TotalDispatched = await _context.Plantings.SumAsync(p => p.Quantity);
            
            var survivals = await _context.Survivals.ToListAsync();
            model.AvgSurvivalRate = survivals.Any() ? survivals.Average(s => s.SurvivalRate) : 0.0;

            var reclamations = await _context.Reclamations.ToListAsync();
            model.ReclamationCompletionRate = reclamations.Any() ? reclamations.Average(r => r.CompletionRate) : 0.0;

            // 2. Species Summary (group by Seedling Type)
            var inventoryGroups = await _context.Inventories
                .GroupBy(i => i.SeedlingTypeId)
                .Select(g => new { SeedlingTypeId = g.Key, Count = g.Sum(x => x.CurrentQuantity) })
                .ToListAsync();

            var seedlingTypes = await _context.SeedlingTypes.ToDictionaryAsync(t => t.Id, t => t.Name);

            int grandTotal = model.TotalSeedlings > 0 ? model.TotalSeedlings : 1;
            foreach (var group in inventoryGroups)
            {
                if (seedlingTypes.TryGetValue(group.SeedlingTypeId, out var speciesName))
                {
                    model.SpeciesSummaries.Add(new SpeciesSummary
                    {
                        SpeciesName = speciesName,
                        Count = group.Count,
                        Percentage = Math.Round((double)group.Count / grandTotal * 100, 1)
                    });
                }
            }
            model.SpeciesSummaries = model.SpeciesSummaries.OrderByDescending(s => s.Count).Take(5).ToList();

            // 3. Block Survivals
            var plantings = await _context.Plantings.ToListAsync();
            var plantingAreas = await _context.PlantingAreas.ToDictionaryAsync(a => a.Id, a => a.Name);

            var areaSurvivals = survivals
                .Select(s => {
                    var planting = plantings.FirstOrDefault(p => p.PlantingNumber == s.PlantingNumber);
                    string blockId = planting != null ? planting.PlantingAreaId : s.PlantingNumber;
                    return new { BlockId = blockId, s.SurvivalRate };
                })
                .GroupBy(x => x.BlockId)
                .Select(g => new { BlockId = g.Key, Rate = g.Average(x => x.SurvivalRate) })
                .ToList();

            foreach (var item in areaSurvivals)
            {
                string displayName = plantingAreas.TryGetValue(item.BlockId, out var name) ? name : item.BlockId;
                if (displayName.StartsWith("PLN-AUDIT-"))
                {
                    var parts = displayName.Split('-');
                    if (parts.Length >= 3)
                    {
                        string dateStr = parts[2];
                        if (dateStr.Length == 8)
                        {
                            displayName = $"Audit {dateStr.Substring(0, 4)}-{dateStr.Substring(4, 2)}-{dateStr.Substring(6, 2)}";
                        }
                        else
                        {
                            displayName = $"Audit Block ({dateStr})";
                        }
                    }
                }
                model.BlockSurvivals.Add(new BlockSurvivalSummary
                {
                    BlockName = displayName,
                    Rate = Math.Round(item.Rate, 1)
                });
            }
            model.BlockSurvivals = model.BlockSurvivals.OrderByDescending(b => b.Rate).Take(5).ToList();

            return View(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboardChartData()
        {
            // Monthly Activity for chart
            // For simplicity, let's aggregate Ledger movements per month of 2026
            var ledgers = await _context.Ledgers.ToListAsync();
            var monthlyData = ledgers
                .Where(l => DateTime.TryParse(l.Date, out var dt) && dt.Year == 2026)
                .GroupBy(l => DateTime.Parse(l.Date).Month)
                .Select(g => new
                {
                    MonthNum = g.Key,
                    Planted = g.Where(x => x.Type == "Planting" || x.Type == "Transfer").Sum(x => x.QtyOut),
                    Received = g.Where(x => x.Type == "Receipt").Sum(x => x.QtyIn)
                })
                .OrderBy(x => x.MonthNum)
                .ToList();

            string[] monthNames = { "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des" };
            
            var labels = new List<string>();
            var plantedCounts = new List<int>();
            var receivedCounts = new List<int>();

            foreach (var data in monthlyData)
            {
                if (data.MonthNum >= 1 && data.MonthNum <= 12)
                {
                    labels.Add(monthNames[data.MonthNum - 1]);
                    plantedCounts.Add(data.Planted);
                    receivedCounts.Add(data.Received);
                }
            }

            return Json(new { labels, planted = plantedCounts, received = receivedCounts });
        }

        public async Task<IActionResult> Inventory()
        {
            // Order by date received descending so the latest data is shown first
            var inventories = await _context.Inventories
                .OrderByDescending(i => i.DateReceived)
                .ToListAsync();

            var seedlingTypes = await _context.SeedlingTypes.ToDictionaryAsync(t => t.Id, t => t.Name);
            var suppliers = await _context.Suppliers.ToDictionaryAsync(s => s.Id, s => s.Name);
            var areas = await _context.NurseryAreas.ToDictionaryAsync(a => a.Id, a => a.Name);

            var model = inventories.Select(i => new InventoryItemViewModel
            {
                Id = i.Id,
                BatchNumber = i.BatchNumber,
                SeedlingTypeName = seedlingTypes.TryGetValue(i.SeedlingTypeId, out var tName) ? tName : "Unknown",
                SupplierName = suppliers.TryGetValue(i.SupplierId, out var sName) ? sName : "Unknown",
                DateReceived = i.DateReceived,
                Quantity = i.Quantity,
                CurrentQuantity = i.CurrentQuantity,
                Age = i.Age,
                Height = i.Height,
                NurseryAreaName = areas.TryGetValue(i.NurseryAreaId, out var aName) ? aName : "Unknown",
                Status = i.Status
            }).ToList();

            return View(model);
        }

        [HttpGet]
        public async Task<IActionResult> CreateInventory()
        {
            ViewBag.SeedlingTypes = await _context.SeedlingTypes.ToListAsync();
            ViewBag.Suppliers = await _context.Suppliers.ToListAsync();
            ViewBag.NurseryAreas = await _context.NurseryAreas.ToListAsync();
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> CreateInventory(Inventory model)
        {
            if (model == null) return BadRequest();

            // Set dynamic properties
            model.Id = Guid.NewGuid().ToString("N");
            model.CurrentQuantity = model.Quantity;
            if (string.IsNullOrEmpty(model.Status))
            {
                model.Status = "Active";
            }

            // Save new inventory batch
            _context.Inventories.Add(model);

            // Create automatic ledger entry (Receipt transaction)
            var ledger = new Ledger
            {
                Id = Guid.NewGuid().ToString("N"),
                TransactionNumber = "TRX-REC-" + DateTime.Now.ToString("yyyyMMdd-HHmmss"),
                Date = model.DateReceived,
                Batch = model.BatchNumber,
                Type = "Receipt",
                QtyIn = model.Quantity,
                QtyOut = 0,
                Balance = model.Quantity,
                Remarks = "Penerimaan bibit batch baru secara otomatis"
            };
            _context.Ledgers.Add(ledger);

            // Record to audit trail
            var audit = new AuditTrail
            {
                Id = Guid.NewGuid().ToString("N"),
                User = User.Identity?.Name ?? "System",
                Module = "Inventory",
                Activity = "Create",
                BeforeValue = "",
                AfterValue = $"Batch: {model.BatchNumber}, Qty: {model.Quantity}, Area: {model.NurseryAreaId}",
                Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };
            _context.AuditTrails.Add(audit);

            await _context.SaveChangesAsync();
            return RedirectToAction("Inventory");
        }

        public async Task<IActionResult> Ledger()
        {
            var model = await _context.Ledgers.OrderByDescending(l => l.Date).ToListAsync();
            return View(model);
        }

        public async Task<IActionResult> NurseryMap()
        {
            var plots = await _context.NurseryAreas.ToListAsync();
            var inventories = await _context.Inventories.ToListAsync();

            var model = plots.Select(p => new NurseryPlotViewModel
            {
                Id = p.Id,
                Code = p.Code,
                Name = p.Name,
                Capacity = p.Capacity,
                Location = p.Location,
                CurrentCount = inventories.Where(i => i.NurseryAreaId == p.Id).Sum(i => i.CurrentQuantity)
            }).ToList();

            return View(model);
        }

        public async Task<IActionResult> Monitoring()
        {
            var model = await _context.Monitorings.OrderByDescending(m => m.MonitoringDate).ToListAsync();
            return View(model);
        }

        public async Task<IActionResult> Mortality()
        {
            var model = await _context.Mortalities.OrderByDescending(m => m.Date).ToListAsync();
            return View(model);
        }

        public async Task<IActionResult> StockOpname()
        {
            var model = await _context.StockOpnames.OrderByDescending(s => s.DateCreated).ToListAsync();
            return View(model);
        }

        public async Task<IActionResult> Planting()
        {
            var model = await _context.Plantings.OrderByDescending(p => p.Date).ToListAsync();
            return View(model);
        }

        public async Task<IActionResult> Survival()
        {
            var model = await _context.Survivals.OrderByDescending(s => s.MonitoringDate).ToListAsync();
            return View(model);
        }

        public async Task<IActionResult> Reclamation()
        {
            var model = await _context.Reclamations.OrderByDescending(r => r.Year).ToListAsync();
            return View(model);
        }

        public async Task<IActionResult> MasterData()
        {
            ViewBag.SeedlingTypes = await _context.SeedlingTypes.ToListAsync();
            ViewBag.Suppliers = await _context.Suppliers.ToListAsync();
            ViewBag.NurseryAreas = await _context.NurseryAreas.ToListAsync();
            ViewBag.PlantingAreas = await _context.PlantingAreas.ToListAsync();
            return View();
        }

        public async Task<IActionResult> UserManagement()
        {
            var model = await _context.Users.ToListAsync();
            return View(model);
        }

        public async Task<IActionResult> AuditTrail()
        {
            var model = await _context.AuditTrails.OrderByDescending(a => a.Timestamp).ToListAsync();
            return View(model);
        }

        // --- 1. Growth Monitoring ---
        [HttpGet]
        public async Task<IActionResult> CreateMonitoring()
        {
            ViewBag.Inventories = await _context.Inventories.Where(i => i.CurrentQuantity > 0).ToListAsync();
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> CreateMonitoring(Monitoring model)
        {
            if (model == null) return BadRequest();
            model.Id = Guid.NewGuid().ToString("N");
            _context.Monitorings.Add(model);

            var inv = await _context.Inventories.FirstOrDefaultAsync(i => i.BatchNumber == model.BatchNumber);
            if (inv != null)
            {
                inv.Height = model.Height;
            }

            var audit = new AuditTrail
            {
                Id = Guid.NewGuid().ToString("N"),
                User = User.Identity?.Name ?? "System",
                Module = "Monitoring",
                Activity = "Create",
                BeforeValue = "",
                AfterValue = $"Batch: {model.BatchNumber}, Height: {model.Height}",
                Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };
            _context.AuditTrails.Add(audit);

            await _context.SaveChangesAsync();
            return RedirectToAction("Monitoring");
        }

        // --- 2. Mortality Records ---
        [HttpGet]
        public async Task<IActionResult> CreateMortality()
        {
            ViewBag.Inventories = await _context.Inventories.Where(i => i.CurrentQuantity > 0).ToListAsync();
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> CreateMortality(Mortality model)
        {
            if (model == null) return BadRequest();
            model.Id = Guid.NewGuid().ToString("N");

            var inv = await _context.Inventories.FirstOrDefaultAsync(i => i.BatchNumber == model.Batch);
            if (inv == null)
            {
                ModelState.AddModelError("", "Batch Number tidak valid atau tidak ditemukan.");
                ViewBag.Inventories = await _context.Inventories.Where(i => i.CurrentQuantity > 0).ToListAsync();
                return View(model);
            }

            if (inv.CurrentQuantity < model.QuantityDead)
            {
                ModelState.AddModelError("", "Jumlah bibit mati tidak boleh melebihi stok aktual.");
                ViewBag.Inventories = await _context.Inventories.Where(i => i.CurrentQuantity > 0).ToListAsync();
                return View(model);
            }

            inv.CurrentQuantity -= model.QuantityDead;
            _context.Mortalities.Add(model);

            var ledger = new Ledger
            {
                Id = Guid.NewGuid().ToString("N"),
                TransactionNumber = "TRX-MORT-" + DateTime.Now.ToString("yyyyMMdd-HHmmss"),
                Date = model.Date,
                Batch = model.Batch,
                Type = "Mortality",
                QtyIn = 0,
                QtyOut = model.QuantityDead,
                Balance = inv.CurrentQuantity,
                Remarks = $"Penyusutan bibit mati: {model.Cause}"
            };
            _context.Ledgers.Add(ledger);

            var audit = new AuditTrail
            {
                Id = Guid.NewGuid().ToString("N"),
                User = User.Identity?.Name ?? "System",
                Module = "Mortality",
                Activity = "Create",
                BeforeValue = "",
                AfterValue = $"Batch: {model.Batch}, QtyDead: {model.QuantityDead}",
                Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };
            _context.AuditTrails.Add(audit);

            await _context.SaveChangesAsync();
            return RedirectToAction("Mortality");
        }

        // --- 3. Planting Log ---
        [HttpGet]
        public async Task<IActionResult> CreatePlanting()
        {
            ViewBag.Inventories = await _context.Inventories.Where(i => i.CurrentQuantity > 0).ToListAsync();
            ViewBag.PlantingAreas = await _context.PlantingAreas.ToListAsync();
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> CreatePlanting(Planting model)
        {
            if (model == null) return BadRequest();
            model.Id = Guid.NewGuid().ToString("N");
            if (string.IsNullOrEmpty(model.Status)) model.Status = "Completed";

            var inv = await _context.Inventories.FirstOrDefaultAsync(i => i.BatchNumber == model.Batch);
            if (inv == null)
            {
                ModelState.AddModelError("", "Batch Number tidak valid atau tidak ditemukan.");
                ViewBag.Inventories = await _context.Inventories.Where(i => i.CurrentQuantity > 0).ToListAsync();
                ViewBag.PlantingAreas = await _context.PlantingAreas.ToListAsync();
                return View(model);
            }

            if (inv.CurrentQuantity < model.Quantity)
            {
                ModelState.AddModelError("", "Jumlah bibit ditanam tidak boleh melebihi stok aktual.");
                ViewBag.Inventories = await _context.Inventories.Where(i => i.CurrentQuantity > 0).ToListAsync();
                ViewBag.PlantingAreas = await _context.PlantingAreas.ToListAsync();
                return View(model);
            }

            inv.CurrentQuantity -= model.Quantity;
            _context.Plantings.Add(model);

            var ledger = new Ledger
            {
                Id = Guid.NewGuid().ToString("N"),
                TransactionNumber = "TRX-PLN-" + DateTime.Now.ToString("yyyyMMdd-HHmmss"),
                Date = model.Date,
                Batch = model.Batch,
                Type = "Planting",
                QtyIn = 0,
                QtyOut = model.Quantity,
                Balance = inv.CurrentQuantity,
                Remarks = $"Penyaluran bibit ke area penanaman {model.PlantingAreaId}"
            };
            _context.Ledgers.Add(ledger);

            var audit = new AuditTrail
            {
                Id = Guid.NewGuid().ToString("N"),
                User = User.Identity?.Name ?? "System",
                Module = "Planting",
                Activity = "Create",
                BeforeValue = "",
                AfterValue = $"Batch: {model.Batch}, Qty: {model.Quantity}, Area: {model.PlantingAreaId}",
                Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };
            _context.AuditTrails.Add(audit);

            await _context.SaveChangesAsync();
            return RedirectToAction("Planting");
        }

        // --- 4. Survival Analysis ---
        [HttpGet]
        public async Task<IActionResult> CreateSurvival()
        {
            ViewBag.Plantings = await _context.Plantings.ToListAsync();
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> CreateSurvival(Survival model)
        {
            if (model == null) return BadRequest();
            model.Id = Guid.NewGuid().ToString("N");

            int total = model.LiveSeedlings + model.DeadSeedlings;
            model.SurvivalRate = total > 0 ? Math.Round((double)model.LiveSeedlings / total * 100, 2) : 0.0;

            _context.Survivals.Add(model);

            var audit = new AuditTrail
            {
                Id = Guid.NewGuid().ToString("N"),
                User = User.Identity?.Name ?? "System",
                Module = "Survival",
                Activity = "Create",
                BeforeValue = "",
                AfterValue = $"PLN Ref: {model.PlantingNumber}, Rate: {model.SurvivalRate}%",
                Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };
            _context.AuditTrails.Add(audit);

            await _context.SaveChangesAsync();
            return RedirectToAction("Survival");
        }

        // --- 5. Reclamation Targets ---
        [HttpGet]
        public IActionResult CreateReclamation()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> CreateReclamation(Reclamation model)
        {
            if (model == null) return BadRequest();
            model.Id = Guid.NewGuid().ToString("N");

            model.CompletionRate = model.TargetSeedlings > 0 ? Math.Round((double)model.ActualSeedlings / model.TargetSeedlings * 100, 2) : 0.0;

            _context.Reclamations.Add(model);

            var audit = new AuditTrail
            {
                Id = Guid.NewGuid().ToString("N"),
                User = User.Identity?.Name ?? "System",
                Module = "Reclamation",
                Activity = "Create",
                BeforeValue = "",
                AfterValue = $"Area: {model.ReclamationArea}, Target: {model.TargetSeedlings}",
                Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };
            _context.AuditTrails.Add(audit);

            await _context.SaveChangesAsync();
            return RedirectToAction("Reclamation");
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
