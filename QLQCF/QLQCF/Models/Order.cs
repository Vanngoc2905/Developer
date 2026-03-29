using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace QLQCF.Models
{
    public class Order
    {
        [Key]
        public int Id { get; set; }

        // Khóa ngoại đến bảng Bans
        [Display(Name = "Bàn")]
        public int? BanId { get; set; }

        [ForeignKey("BanId")]
        [ValidateNever]
        public Ban Ban { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        [Display(Name = "Ngày đặt")]
        public DateTime OrderDate { get; set; }

        [Required]
        [Display(Name = "Tổng tiền")]
        public decimal TotalPrice { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập tên khách hàng")]
        [Display(Name = "Khách hàng")]
        public string CustomerName { get; set; }

        [Display(Name = "Địa chỉ giao hàng")]
        public string ShippingAddress { get; set; } = "";

        [Display(Name = "Ghi chú")]
        public string Notes { get; set; } = "";
        public string? ApplicationUserId { get; set; }
        public ApplicationUser? ApplicationUser { get; set; }


        [ValidateNever]
        public List<OrderDetail> OrderDetails { get; set; }
    }
}
