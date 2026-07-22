using System.Collections.Generic;

namespace Nursari.Models
{
    public class DashboardViewModel
    {
        public int TotalSeedlings { get; set; }
        public int TotalDispatched { get; set; }
        public double AvgSurvivalRate { get; set; }
        public double ReclamationCompletionRate { get; set; }
        public List<SpeciesSummary> SpeciesSummaries { get; set; } = new();
        public List<MonthlyActivity> MonthlyActivities { get; set; } = new();
        public List<BlockSurvivalSummary> BlockSurvivals { get; set; } = new();
    }

    public class SpeciesSummary
    {
        public string SpeciesName { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
    }

    public class MonthlyActivity
    {
        public string Month { get; set; } = string.Empty;
        public int Planted { get; set; }
        public int Received { get; set; }
    }

    public class BlockSurvivalSummary
    {
        public string BlockName { get; set; } = string.Empty;
        public double Rate { get; set; }
    }

    public class InventoryItemViewModel
    {
        public string Id { get; set; } = string.Empty;
        public string BatchNumber { get; set; } = string.Empty;
        public string SeedlingTypeName { get; set; } = string.Empty;
        public string SupplierName { get; set; } = string.Empty;
        public string DateReceived { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public int CurrentQuantity { get; set; }
        public int Age { get; set; }
        public double Height { get; set; }
        public string NurseryAreaName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class NurseryPlotViewModel
    {
        public string Id { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public int CurrentCount { get; set; }
        public double UtilizationRate => Capacity > 0 ? (double)CurrentCount / Capacity * 100 : 0;
        public string Location { get; set; } = string.Empty;
        public string StatusClass => UtilizationRate > 90 ? "full" : (UtilizationRate > 50 ? "medium" : "empty");
    }
}
