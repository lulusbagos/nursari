using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Nursari.Models
{
    [Table("tbl_m_planting_area")]
    public class PlantingArea
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [Column("code")]
        public string Code { get; set; } = string.Empty;

        [Required]
        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("size")]
        public double Size { get; set; }

        [Column("coordinates")]
        public string? Coordinates { get; set; }
    }
}
