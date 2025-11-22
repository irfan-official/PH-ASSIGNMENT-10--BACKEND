import { ObjectId } from "mongodb";

class Review {
  static validate({
    user,
    foodName,
    image,
    category,
    ratings,
    restaurantName,
    location,
    reviewText,
  }) {
    const data = {
      user,
      foodName: typeof foodName === "string" ? foodName.trim() : foodName,
      image: typeof image === "string" ? image.trim() : image,
      category: typeof category === "string" ? category.trim() : category,
      restaurantName:
        typeof restaurantName === "string"
          ? restaurantName.trim()
          : restaurantName,
      location: typeof location === "string" ? location.trim() : location,
      reviewText:
        typeof reviewText === "string" ? reviewText.trim() : reviewText,
      ratings,
    };

    if (!(data.user instanceof ObjectId)) {
      throw new TypeError("user must be a valid MongoDB ObjectId");
    }

    if (typeof data.foodName !== "string" || data.foodName.length === 0) {
      throw new TypeError("foodName must be a non-empty string");
    }

    if (typeof data.image !== "string" || data.image.length === 0) {
      throw new TypeError("image must be a non-empty string");
    }

    const validCategories = ["Home", "Street", "Hotel", "Restaurant"];
    if (!validCategories.includes(data.category)) {
      throw new TypeError(
        `category must be one of: ${validCategories.join(", ")}`
      );
    }

    if (
      typeof data.ratings !== "number" ||
      data.ratings < 0 ||
      data.ratings > 5
    ) {
      throw new TypeError("ratings must be a number between 0 and 5");
    }

    if (
      typeof data.restaurantName !== "string" ||
      data.restaurantName.length === 0
    ) {
      throw new TypeError("restaurantName must be a non-empty string");
    }

    if (typeof data.location !== "string" || data.location.length === 0) {
      throw new TypeError("location must be a non-empty string");
    }

    if (typeof data.reviewText !== "string" || data.reviewText.length < 47) {
      throw new TypeError(
        "reviewText must be a string of at least 47 characters"
      );
    }

    return data;
  }

  constructor({
    user,
    foodName,
    image,
    category,
    ratings,
    restaurantName,
    location,
    reviewText,
  }) {
    const validData = Review.validate({
      user,
      foodName,
      image,
      category,
      ratings,
      restaurantName,
      location,
      reviewText,
    });

    Object.assign(
      this,
      { ...validData, loved: [], comments: {} },
      {
        createdAt: new Date().toISOString().replace("Z", "+00:00"),
      }
    );
  }
  addLovedUser(user) {
    if (!(user instanceof ObjectId)) {
      throw new TypeError("favorite user must be a valid MongoDB ObjectId");
    }
    if (!this.loved.find((u) => u.equals(user))) {
      this.loved.push(user);
    }
  }

  removeLovedUser(user) {
    if (!(user instanceof ObjectId)) {
      throw new TypeError("favorite user must be a valid MongoDB ObjectId");
    }

    this.loved = this.loved.filter((u) => !u.equals(user));
  }
}

export default Review;

// const review = new Review({
//   user: new ObjectId("67e12159b08d6a9c0b597c10"),
//   foodName: "  Pizza  ",
//   image: "  pizza.jpg  ",
//   category: "Restaurant",
//   ratings: 4.5,
//   restaurantName: "  Napoli's  ",
//   location: "  New York City  ",
//   reviewText:
//     "  This pizza was amazing, very cheesy and full of flavor! Highly recommend!  ",
// });

// review.addFavorite(new ObjectId("67e12159b08d6a9c0b597c10"));
// console.log(review);

// review.removeFavorite(new ObjectId("67e12159b08d6a9c0b597c10"));
// console.log(review);
