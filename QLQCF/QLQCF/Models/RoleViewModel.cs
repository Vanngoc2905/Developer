using Microsoft.AspNetCore.Identity;
using QLQCF.Models;
using System.Collections.Generic;

namespace QLQCF.Models
{
    public class RoleViewModel
    {
        public List<ApplicationUser> Users { get; set; } = new();
        public List<IdentityRole> Roles { get; set; } = new();
        public UserManager<ApplicationUser> UserManager { get; set; }
    }
}
