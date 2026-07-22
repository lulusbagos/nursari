using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Nursari.Models
{
    [Table("tbl_t_stock_opname")]
    public class StockOpname
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [Column("opname_number")]
        public string OpnameNumber { get; set; } = string.Empty;

        [Column("date_created")]
        public string DateCreated { get; set; } = string.Empty;

        [Column("date_completed")]
        public string? DateCompleted { get; set; }

        [Column("status")]
        public string? Status { get; set; }

        [Column("created_by")]
        public string? CreatedBy { get; set; }

        [Column("approved_by")]
        public string? ApprovedBy { get; set; }

        [Required]
        [Column("batch_number")]
        public string BatchNumber { get; set; } = string.Empty;

        [Required]
        [Column("seedling_type_id")]
        public string SeedlingTypeId { get; set; } = string.Empty;

        [Column("system_qty")]
        public int SystemQty { get; set; }

        [Column("physical_qty")]
        public int PhysicalQty { get; set; }

        [Column("variance")]
        public int Variance { get; set; }
    }
}
