using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Nursari.Models
{
    [Table("tbl_m_user")]
    public class User
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("username")]
        public string Username { get; set; } = string.Empty;

        [Required]
        [Column("nama_lengkap")]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Column("password")]
        public string Password { get; set; } = string.Empty;

        [Column("no_nik")]
        public string? NoNik { get; set; }

        [Column("id_perusahaan")]
        public string? IdPerusahaan { get; set; }

        [Column("kode_perusahaan")]
        public string? KodePerusahaan { get; set; }

        [Column("nama_perusahaan")]
        public string? NamaPerusahaan { get; set; }

        [Column("id_departemen")]
        public string? IdDepartemen { get; set; }

        [Column("kode_departemen")]
        public string? KodeDepartemen { get; set; }

        [Column("nama_departemen")]
        public string? NamaDepartemen { get; set; }

        [Column("id_seksi")]
        public string? IdSeksi { get; set; }

        [Column("kode_seksi")]
        public string? KodeSeksi { get; set; }

        [Column("nama_seksi")]
        public string? NamaSeksi { get; set; }

        [Column("id_jabatan")]
        public string? IdJabatan { get; set; }

        [Column("kode_jabatan")]
        public string? KodeJabatan { get; set; }

        [Column("nama_jabatan")]
        public string? NamaJabatan { get; set; }

        [Column("id_posisi")]
        public string? IdPosisi { get; set; }

        [Column("nama_posisi")]
        public string? NamaPosisi { get; set; }

        [Required]
        [Column("role")]
        public string Role { get; set; } = "Officer";

        [Required]
        [Column("status")]
        public string Status { get; set; } = "Active";
    }
}
