using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Nursari.Models
{
    [Table("tbl_m_nursery_area")]
    public class NurseryArea
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

        [Column("capacity")]
        public int Capacity { get; set; }

        [Column("location")]
        public string Location { get; set; } = string.Empty;

        [Column("description")]
        public string Description { get; set; } = string.Empty;
    }
}
