namespace QLQCF.Models
{
    internal class CreateRecipeViewModel
    {
        public int ProductId { get; set; }
        public IEnumerable<Ingredient> Ingredients { get; set; }
        public int IngredientId { get; internal set; }
        public double AmountNeeded { get; internal set; }
    }
}