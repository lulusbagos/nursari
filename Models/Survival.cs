using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Nursari.Models
{
    [Table("tbl_t_survival")]
    public class Survival
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [Column("planting_number")]
        public string PlantingNumber { get; set; } = string.Empty;

        [Column("monitoring_date")]
        public string? MonitoringDate { get; set; }

        [Column("live_seedlings")]
        public int LiveSeedlings { get; set; }

        [Column("dead_seedlings")]
        public int DeadSeedlings { get; set; }

        [Column("survival_rate")]
        public double SurvivalRate { get; set; }
    }
}
