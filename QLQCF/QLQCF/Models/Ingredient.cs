using System.ComponentModel.DataAnnotations;

namespace QLQCF.Models
{
    public class Ingredient
    {
        [Key]
        [Required]
        public int IngredientId { get; set; }
        [Required]
        public string Name { get; set; }
        public string Unit { get; set; } // ml, gram, piece, etc.
        public double CurrentQuantity { get; set; }

        public ICollection<Recipe> Recipes { get; set; }
    }
}
