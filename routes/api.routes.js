import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import verifyOrigin from "../middlewares/allowOrigin.middleware.js";
import verifyJWTToken from "../middlewares/firebase.jwt.middleware.js";

import { createOne, find, findOne } from "../utils/mongodbCRUD.js";
import { ObjectId } from "mongodb";
import connectDB from "../connections/mongodb.connection.js";

import Comment from "../models/comment.model.js";
import Review from "../models/review.model.js";
import User from "../models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockDataPath = path.join(__dirname, "../utils/MOCK_DATA.json");
const mockData = JSON.parse(fs.readFileSync(mockDataPath, "utf-8"));

const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({
    message: "hello api_route",
  });
});

router.get("/data", verifyOrigin, (req, res) => {
  return res.status(200).json(mockData);
});

// router.post("/add-data", verifyOrigin, async (req, res) => {
//   const data = await createFood({
//     ...req.body,
//     name: "gele-bi",
//     createdAt: Date.now(),
//   });

//   return res.status(200).send(data);
// });

router.get("/secure-data", verifyOrigin, verifyJWTToken, (req, res) => {
  return res.status(200).json(mockData);
});

router.get("/data/:id", verifyOrigin, verifyJWTToken, (req, res) => {
  const { id } = req.params;

  console.log("id ==> ", id);
  return res.status(200).json(mockData);
});

export default router;

router.get("/home-data", verifyOrigin, async (req, res, next) => {
  try {
    const reviews = await find({
      data: {},
      collectionName: "reviews",
      options: { limit: 6 },
    });

    for (let review of reviews) {
      let user = await findOne({
        data: {
          _id: new ObjectId(review.user),
        },
        collectionName: "users",
      });

      review.user = user;
    }

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/home-others-data", verifyOrigin, async (req, res, next) => {
  try {
    const responseReviewers = await find({
      data: {},
      collectionName: "top_reviewers",
    });

    const responseFeedbacks = await find({
      data: {},
      collectionName: "feedbacks",
    });

    return res.status(200).json({
      success: true,
      topReviewers: responseReviewers,
      usersFeedback: responseFeedbacks,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/create/user",
  verifyOrigin,
  verifyJWTToken,
  async (req, res, next) => {
    try {
      // const {displayName, email, photoURL} = req.body;
      const { name, email, image } = req.body;

      const checkedUser = await findOne({
        data: {
          name,
          email,
        },
        collectionName: "users",
      });

      if (checkedUser) {
        return res.status(200).json({
          success: false,
          _id: String(checkedUser._id),
          message: "user Already exist",
        });
      }

      const schema = {
        name,
        email,
        image,
      };
      const createdUser = await createOne({
        data: new User(schema),
        collectionName: "users",
      });

      // console.log("createdUser ===> ", createdUser);

      return res.status(201).json({
        success: true,
        _id: String(createdUser.insertedId),
        message: "user created successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post("/login/user", verifyOrigin, async (req, res, next) => {
  try {
    // const {displayName, email, photoURL} = req.body;
    const { name, email, image } = req.body;

    console.log("res ==> ==> ", req.body);

    const checkedUser = await findOne({
      data: {
        name,
        email,
      },
      collectionName: "users",
    });

    let user = null;

    if (!checkedUser) {
      // create user

      const schema = {
        name,
        email,
        image,
      };
      user = await createOne({
        data: new User(schema),
        collectionName: "users",
      });
      user._id = user.insertedId;
    } else {
      user = await findOne({
        data: { name, email },
        collectionName: "users",
      });
    }

    return res.status(201).json({
      success: true,
      _id: String(user._id),
      message: "Login successful",
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/create/review",
  verifyOrigin,
  verifyJWTToken,
  async (req, res, next) => {
    try {
      // const {displayName, email, photoURL} = req.body;
      const {
        name,
        email,
        foodName,
        image,
        category,
        ratings,
        restaurantName,
        location,
        reviewText,
      } = req.body;

      const checkedUser = await findOne({
        data: {
          name,
          email,
        },
        collectionName: "users",
      });

      // console.log("checkedUser == ", checkedUser);

      const schema = {
        user: checkedUser._id,
        foodName,
        image,
        category,
        ratings,
        restaurantName,
        location,
        reviewText,
      };

      const createdReviews = await createOne({
        data: new Review(schema),
        collectionName: "reviews",
      });

      console.log("createdReviews ===> ", createdReviews);

      return res.status(201).json({
        success: true,
        message: "Review created!",
      });
    } catch (error) {
      console.log("Error /create/review => ", error.message);
      next(error);
    }
  }
);

router.get("/search/review", async (req, res, next) => {
  const { searchValue } = req.query;

  try {
    if (!searchValue) return res.json([]);

    // escape special regex chars for safety
    const escapeRegex = (str) =>
      str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    const regex = new RegExp(escapeRegex(searchValue), "i");

    const query = {
      $or: [
        { category: { $regex: regex } },
        { foodName: { $regex: regex } },
        { restaurantName: { $regex: regex } },
        { location: { $regex: regex } },
        { reviewText: { $regex: regex } },
      ],
    };

    const reviews = await find({
      collectionName: "reviews",
      data: query,
    });

    for (let review of reviews) {
      let user = await findOne({
        data: {
          _id: new ObjectId(review.user),
        },
        collectionName: "users",
      });

      review.user = user;
    }

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
});

router.put("/update/user", async (req, res, next) => {
  try {
    let { name, email, image } = req.body;

    name = name.trim();
    email = email.trim();
    image = image.trim();

    if (!name || !email || !image) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, email, and image are required",
      });
    }

    const user = await findOne({
      data: { name, email },
      collectionName: "users",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const db = await connectDB();

    // 4️⃣ Replace user fields
    const updateResult = await db.collection("users").updateOne(
      { _id: new ObjectId(user._id) }, // filter by unique _id
      {
        $set: {
          name,
          email,
          image,
          updatedAt: new Date().toISOString(), // optional: track updates
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "User update failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        _id: user._id,
        name,
        email,
        image,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/shows/all-reviews", verifyOrigin, async (req, res, next) => {
  try {
    const reviews = await find({
      data: {},
      collectionName: "reviews",
    });

    for (let review of reviews) {
      let user = await findOne({
        data: {
          _id: new ObjectId(review.user),
        },
        collectionName: "users",
      });

      review.user = user;
    }

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/shows/my-reviews", async (req, res, next) => {
  let { name, email } = req.query;

  name: name.trim();
  email: email.trim();

  try {
    const user = await findOne({
      data: {
        name,
        email,
      },
      collectionName: "users",
    });

    const reviews = await find({
      data: {
        user: new ObjectId(user._id),
      },
      collectionName: "reviews",
    });
    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/shows/loved-reviews", async (req, res, next) => {
  try {
    let { name, email } = req.query;

    name: name.trim();
    email: email.trim();

    const user = await findOne({
      data: {
        name,
        email,
      },
      collectionName: "users",
    });

    if (!user) {
      return res.status(200).json({
        success: false,
        message: "user not exist!",
      });
    }

    const reviews = await find({
      data: {
        loved: new ObjectId(user._id),
      },
      collectionName: "reviews",
    });
    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/add/loved-reviews", async (req, res, next) => {
  try {
    let { _id, reviewId } = req.body;

    // console.log("/add/loved-reviews ==> ", req.body);

    const user = await findOne({
      data: { _id: new ObjectId(_id) },
      collectionName: "users",
    });

    if (!user) {
      console.log("not found user!");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const db = await connectDB();

    const updateResult = await db
      .collection("reviews")
      .updateOne(
        { _id: new ObjectId(reviewId) },
        { $addToSet: { loved: new ObjectId(user._id) } }
      );

    if (updateResult.modifiedCount === 0) {
      console.log("fail");
      return res.status(400).json({
        success: false,
        message: "No review updated (maybe already loved or invalid reviewId)",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review added to loved list successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/remove/loved-reviews", async (req, res, next) => {
  try {
    let { name, email, reviewId } = req.body;

    name: name.trim();
    email: email.trim();

    const user = await findOne({
      data: { name, email },
      collectionName: "users",
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const db = await connectDB();

    // 3️⃣ Remove user ObjectId from loved array
    const updateResult = await db.collection("reviews").updateOne(
      { _id: new ObjectId(reviewId), user: new ObjectId(user._id) },
      { $pull: { loved: new ObjectId(user._id) } } // <-- use $pull instead of $addToSet
    );

    // 4️⃣ Check if anything was updated
    if (updateResult.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "User was not in loved list or review already updated before.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User removed from loved list successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/remove/reviews", async (req, res, next) => {
  try {
    let { name, email, reviewId } = req.body;

    name: name.trim();
    email: email.trim();

    if (!name || !email || !reviewId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const user = await findOne({
      data: { name, email },
      collectionName: "users",
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const db = await connectDB();

    const deleteResult = await db.collection("reviews").deleteOne({
      _id: new ObjectId(reviewId),
      user: new ObjectId(user._id),
    });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Review not found or not owned by this user",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/shows/all-comments", async (req, res, next) => {
  try {
    console.log("/shows/all-comments = ", req.query.review_id);

    const allComments = await find({
      data: {
        review: new ObjectId(req.query.review_id),
      },
      collectionName: "comments",
    });

    const newAllComments = [];

    for (let obj of allComments) {
      let searchUser = await findOne({
        data: {
          _id: new ObjectId(obj.user),
        },
        collectionName: "users",
      });

      newAllComments.push({
        image: searchUser.image,
        name: searchUser.name,
        createdAt: obj.createdAt,
        comment: obj.comment,
      });
    }

    console.log("all comments = ", newAllComments);

    return res.status(200).json({
      success: true,
      data: newAllComments || [],
    });
  } catch (error) {
    console.log("Error /get/comments => ", error.message);
    next(error);
  }
});

router.post("/create/comments", async (req, res, next) => {
  try {
    console.log("/create/comments = ", req?.body);

    const { review_id, user_id, comment } = req.body;

    const createComment = await createOne({
      data: new Comment({
        user: new ObjectId(user_id),
        review: new ObjectId(review_id),
        comment,
      }),
      collectionName: "comments",
    });

    console.log("comment created => ", createComment);

    return res.status(200).json({
      success: true,
      // data: [],
    });
  } catch (error) {
    console.log("Error /create/comments => ", error.message);
    next(error);
  }
});
