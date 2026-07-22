using Microsoft.EntityFrameworkCore;

namespace Nursari.Models
{
    public class NurseryContext : DbContext
    {
        public NurseryContext(DbContextOptions<NurseryContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<SeedlingType> SeedlingTypes { get; set; } = null!;
        public DbSet<Supplier> Suppliers { get; set; } = null!;
        public DbSet<NurseryArea> NurseryAreas { get; set; } = null!;
        public DbSet<PlantingArea> PlantingAreas { get; set; } = null!;
        public DbSet<Inventory> Inventories { get; set; } = null!;
        public DbSet<Ledger> Ledgers { get; set; } = null!;
        public DbSet<Monitoring> Monitorings { get; set; } = null!;
        public DbSet<Mortality> Mortalities { get; set; } = null!;
        public DbSet<StockOpname> StockOpnames { get; set; } = null!;
        public DbSet<Planting> Plantings { get; set; } = null!;
        public DbSet<Survival> Survivals { get; set; } = null!;
        public DbSet<Reclamation> Reclamations { get; set; } = null!;
        public DbSet<AuditTrail> AuditTrails { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Customize any table structures if needed
        }
    }
}
