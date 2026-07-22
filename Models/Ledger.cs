using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Nursari.Models
{
    [Table("tbl_t_ledger")]
    public class Ledger
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [Column("transaction_number")]
        public string TransactionNumber { get; set; } = string.Empty;

        [Required]
        [Column("date")]
        public string Date { get; set; } = string.Empty;

        [Required]
        [Column("batch")]
        public string Batch { get; set; } = string.Empty;

        [Required]
        [Column("type")]
        public string Type { get; set; } = string.Empty;

        [Column("qty_in")]
        public int QtyIn { get; set; }

        [Column("qty_out")]
        public int QtyOut { get; set; }

        [Column("balance")]
        public int Balance { get; set; }

        [Column("remarks")]
        public string Remarks { get; set; } = string.Empty;
    }
}
