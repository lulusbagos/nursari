using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Nursari.Models
{
    [Table("tbl_m_seedling_type")]
    public class SeedlingType
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

        [Column("category")]
        public string? Category { get; set; }

        [Column("scientific_name")]
        public string? ScientificName { get; set; }

        [Column("description")]
        public string? Description { get; set; }
    }
}
