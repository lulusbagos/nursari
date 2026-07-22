using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace Nursari.Models
{
    public static class DatabaseSeeder
    {
        public static void Seed(NurseryContext context, string rootPath)
        {
            context.Database.EnsureCreated();

            // Check if seeding is already done (by checking Users table)
            if (context.Users.Any())
            {
                return; // DB already seeded
            }

            string jsonPath = Path.Combine(rootPath, "initial_data.json");
            if (!File.Exists(jsonPath))
            {
                Console.WriteLine($"[DatabaseSeeder] Seeding file not found: {jsonPath}");
                return;
            }

            try
            {
                string jsonString = File.ReadAllText(jsonPath);
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var data = JsonSerializer.Deserialize<InitialDataWrapper>(jsonString, options);

                if (data != null)
                {
                    if (data.Users != null && data.Users.Any())
                    {
                        context.Users.AddRange(data.Users);
                    }
                    if (data.SeedlingTypes != null && data.SeedlingTypes.Any())
                    {
                        context.SeedlingTypes.AddRange(data.SeedlingTypes);
                    }
                    if (data.Suppliers != null && data.Suppliers.Any())
                    {
                        context.Suppliers.AddRange(data.Suppliers);
                    }
                    if (data.NurseryAreas != null && data.NurseryAreas.Any())
                    {
                        context.NurseryAreas.AddRange(data.NurseryAreas);
                    }
                    if (data.PlantingAreas != null && data.PlantingAreas.Any())
                    {
                        context.PlantingAreas.AddRange(data.PlantingAreas);
                    }
                    if (data.Inventory != null && data.Inventory.Any())
                    {
                        context.Inventories.AddRange(data.Inventory);
                    }
                    if (data.Ledger != null && data.Ledger.Any())
                    {
                        context.Ledgers.AddRange(data.Ledger);
                    }
                    if (data.Monitoring != null && data.Monitoring.Any())
                    {
                        context.Monitorings.AddRange(data.Monitoring);
                    }
                    if (data.Mortality != null && data.Mortality.Any())
                    {
                        context.Mortalities.AddRange(data.Mortality);
                    }
                    if (data.StockOpname != null && data.StockOpname.Any())
                    {
                        context.StockOpnames.AddRange(data.StockOpname);
                    }
                    if (data.Planting != null && data.Planting.Any())
                    {
                        context.Plantings.AddRange(data.Planting);
                    }
                    if (data.Survival != null && data.Survival.Any())
                    {
                        context.Survivals.AddRange(data.Survival);
                    }
                    if (data.Reclamation != null && data.Reclamation.Any())
                    {
                        context.Reclamations.AddRange(data.Reclamation);
                    }
                    if (data.AuditTrail != null && data.AuditTrail.Any())
                    {
                        context.AuditTrails.AddRange(data.AuditTrail);
                    }

                    context.SaveChanges();
                    Console.WriteLine("[DatabaseSeeder] Database seeded successfully.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DatabaseSeeder] Error seeding database: {ex.Message}");
            }
        }
    }

    public class InitialDataWrapper
    {
        public List<User>? Users { get; set; }
        public List<SeedlingType>? SeedlingTypes { get; set; }
        public List<Supplier>? Suppliers { get; set; }
        public List<NurseryArea>? NurseryAreas { get; set; }
        public List<PlantingArea>? PlantingAreas { get; set; }
        public List<Inventory>? Inventory { get; set; }
        public List<Ledger>? Ledger { get; set; }
        public List<Monitoring>? Monitoring { get; set; }
        public List<Mortality>? Mortality { get; set; }
        public List<StockOpname>? StockOpname { get; set; }
        public List<Planting>? Planting { get; set; }
        public List<Survival>? Survival { get; set; }
        public List<Reclamation>? Reclamation { get; set; }
        public List<AuditTrail>? AuditTrail { get; set; }
    }
}
