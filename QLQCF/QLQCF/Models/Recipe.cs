
using System.ComponentModel.DataAnnotations;

namespace QLQCF.Models
{
    public class Recipe
    {
        [Key] // hoặc [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int RecipeId { get; set; }
        [Required]
        public int ProductId { get; set; }
        [Required]
        public int IngredientId { get; set; }
        [Required]
        public double AmountNeeded { get; set; }

        // Navigation
        public virtual Product Product { get; set; }
        public virtual Ingredient Ingredient { get; set; }
        public double QuantityUsed { get; set; }

    }
}
