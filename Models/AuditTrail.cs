using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Nursari.Models
{
    [Table("tbl_t_audit_trail")]
    public class AuditTrail
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [Column("user")]
        public string User { get; set; } = string.Empty;

        [Column("module")]
        public string? Module { get; set; }

        [Column("activity")]
        public string? Activity { get; set; }

        [Column("before_value")]
        public string? BeforeValue { get; set; }

        [Column("after_value")]
        public string? AfterValue { get; set; }

        [Column("timestamp")]
        public string Timestamp { get; set; } = string.Empty;
    }
}
