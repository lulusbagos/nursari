using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Nursari.Models
{
    [Table("tbl_t_inventory")]
    public class Inventory
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [Column("batch_number")]
        public string BatchNumber { get; set; } = string.Empty;

        [Required]
        [Column("seedling_type_id")]
        public string SeedlingTypeId { get; set; } = string.Empty;

        [Column("supplier_id")]
        public string? SupplierId { get; set; }

        [Column("date_received")]
        public string? DateReceived { get; set; }

        [Column("quantity")]
        public int Quantity { get; set; }

        [Column("current_quantity")]
        public int CurrentQuantity { get; set; }

        [Column("age")]
        public int Age { get; set; }

        [Column("height")]
        public double Height { get; set; }

        [Column("nursery_area_id")]
        public string? NurseryAreaId { get; set; }

        [Column("status")]
        public string? Status { get; set; }
    }
}
