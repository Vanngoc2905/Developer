namespace QLQCF.Models
{

    public class InvoiceHistory
    {
        public int Id { get; set; }

        public int OrderId { get; set; }
        public Order Order { get; set; }

        public string? UserId { get; set; }
        public ApplicationUser? ApplicationUser { get; set; }

        public int? BanId { get; set; }               // Khoá ngoại
        public Ban? Ban { get; set; }                 // 👉 Navigation Property

        public DateTime CreatedAt { get; set; }
    }


}
