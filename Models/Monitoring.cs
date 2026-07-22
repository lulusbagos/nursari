using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Nursari.Models
{
    [Table("tbl_t_monitoring")]
    public class Monitoring
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [Column("monitoring_date")]
        public string MonitoringDate { get; set; } = string.Empty;

        [Required]
        [Column("batch_number")]
        public string BatchNumber { get; set; } = string.Empty;

        [Column("height")]
        public double Height { get; set; }

        [Column("diameter")]
        public string Diameter { get; set; } = string.Empty;

        [Column("leaf_condition")]
        public string LeafCondition { get; set; } = string.Empty;

        [Column("health_score")]
        public double HealthScore { get; set; }

        [Column("notes")]
        public string Notes { get; set; } = string.Empty;

        [Column("photo")]
        public string Photo { get; set; } = string.Empty;
    }
}
