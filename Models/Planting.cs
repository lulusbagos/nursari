using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Nursari.Models
{
    [Table("tbl_t_planting")]
    public class Planting
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [Column("planting_number")]
        public string PlantingNumber { get; set; } = string.Empty;

        [Required]
        [Column("planting_area_id")]
        public string PlantingAreaId { get; set; } = string.Empty;

        [Column("date")]
        public string Date { get; set; } = string.Empty;

        [Required]
        [Column("batch")]
        public string Batch { get; set; } = string.Empty;

        [Column("quantity")]
        public int Quantity { get; set; }

        [Column("pic")]
        public string Pic { get; set; } = string.Empty;

        [Column("coordinates")]
        public string Coordinates { get; set; } = string.Empty;

        [Column("status")]
        public string Status { get; set; } = string.Empty;
    }
}
