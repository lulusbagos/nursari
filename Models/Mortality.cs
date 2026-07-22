using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Nursari.Models
{
    [Table("tbl_t_mortality")]
    public class Mortality
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [Column("date")]
        public string Date { get; set; } = string.Empty;

        [Required]
        [Column("batch")]
        public string Batch { get; set; } = string.Empty;

        [Column("quantity_dead")]
        public int QuantityDead { get; set; }

        [Column("cause")]
        public string? Cause { get; set; }
    }
}
