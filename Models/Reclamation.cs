using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Nursari.Models
{
    [Table("tbl_t_reclamation")]
    public class Reclamation
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [Column("reclamation_area")]
        public string ReclamationArea { get; set; } = string.Empty;

        [Column("area_size")]
        public double AreaSize { get; set; }

        [Column("year")]
        public int Year { get; set; }

        [Column("target_seedlings")]
        public int TargetSeedlings { get; set; }

        [Column("actual_seedlings")]
        public int ActualSeedlings { get; set; }

        [Column("completion_rate")]
        public double CompletionRate { get; set; }
    }
}
