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
            model.ReclamationCompletionRate = reclamations.Any() ? reclamations.Average(r => r.CompletionRate) * 100 : 0.0;

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
                .Join(plantings, s => s.PlantingNumber, p => p.PlantingNumber, (s, p) => new { p.PlantingAreaId, s.SurvivalRate })
                .GroupBy(x => x.PlantingAreaId)
                .Select(g => new { AreaId = g.Key, Rate = g.Average(x => x.SurvivalRate) })
                .ToList();

            foreach (var item in areaSurvivals)
            {
                if (plantingAreas.TryGetValue(item.AreaId, out var areaName))
                {
                    model.BlockSurvivals.Add(new BlockSurvivalSummary
                    {
                        BlockName = areaName,
                        Rate = Math.Round(item.Rate, 1)
                    });
                }
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
            var inventories = await _context.Inventories.ToListAsync();
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

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
