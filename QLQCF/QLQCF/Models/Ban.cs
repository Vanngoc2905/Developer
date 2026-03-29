using System.ComponentModel.DataAnnotations;

namespace QLQCF.Models
{
    public class Ban
    {

            public int Id { get; set; }
            public string Name { get; set; } = string.Empty;
            public int Socho {  get; set; }
            public string? Description { get; set; }



            public virtual ICollection<Order> Orders { get; set; }
    }
}
