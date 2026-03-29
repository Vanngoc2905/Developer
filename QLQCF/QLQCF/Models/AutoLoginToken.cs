namespace QLQCF.Models
{
    public class AutoLoginToken
    {
        public int Id { get; set; }
        public string Token { get; set; } // ví dụ: ban1-token-xyz
        public string UserId { get; set; }
        public string RedirectUrl { get; set; } // ví dụ: "/Ban/ChonMon?banId=1"
    }

}
