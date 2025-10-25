// addLogoToRestaurants.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import Restaurant from "./models/Restaurant.js"; // your model path

dotenv.config();

await mongoose.connect(process.env.MONGO_URI, {
    dbName: "delivery_app",
});

const allRestaurants = await Restaurant.find();

for (const rest of allRestaurants) {
    if (!rest.logo) {
        // Add your logo field (random, or based on name)
        const logos = [
            "https://static.vecteezy.com/system/resources/previews/052/792/818/non_2x/restaurant-logo-design-vector.jpg",
            "https://img.freepik.com/premium-vector/restaurant-logo-design_636083-178.jpg",
            "https://static.vecteezy.com/system/resources/previews/054/040/877/non_2x/creative-business-and-restaurant-logo-professional-design-ideas-free-vector.jpg",
            "https://img.freepik.com/premium-vector/logo-steak-restaurant-with-fork-knife_1240970-33805.jpg?semt=ais_hybrid&w=740&q=80",
            "https://image.similarpng.com/file/similarpng/very-thumbnail/2021/07/Restaurant-logo-on-transparent-background-PNG.png",
            "https://images.freecreatives.com/wp-content/uploads/2016/03/Fast-Food-Restaurant-Logo-Design.jpg",
            "https://graphicsfamily.com/wp-content/uploads/edd/2023/02/Restaurant-Logo-Design-2-1180x664.jpg",
            "https://images.freecreatives.com/wp-content/uploads/2016/03/Creative-modern-and-unique-restaurant-logo-design.jpg",
            
        ];

        rest.logo = logos[Math.floor(Math.random() * logos.length)];

        await rest.save();
        console.log(`✅ Added logo for ${rest.name}`);
    }
}

console.log("🎉 Logo field added to all restaurants!");
await mongoose.disconnect();
