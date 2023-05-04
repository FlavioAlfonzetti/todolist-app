const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const _ = require("lodash")

const app = express();

mongoose.set('strictQuery', true);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect('mongodb+srv://admin-flavio:test1234@cluster0.iz7u91h.mongodb.net/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true,});

// mongoose.connect('mongodb://127.0.0.1:27017/todolistDB'/* , {useNewUrlParser: true} */);

const itemsSchema = new mongoose.Schema ({
  name: String
})

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item ({
  name: "Buy groceries",
})

const item2 = new Item ({
  name: "Take out the trash",
})

const item3 = new Item ({
  name: "Final touch to my new app"
})

const defaultItems = [item1, item2, item3]


const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)


app.get("/", function(req, res) {

  Item.find({}, (err, foundItems) => {
  
    if(foundItems.length == 0) {
      
      Item.insertMany(defaultItems)
      .then(() => {
        console.log("Successfully saved all the items to todolistDB!");
      })
      .catch((err) => {
        console.log(err);
      })
      res.redirect("/")
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName)

  List.findOne({name: customListName}, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })
      
        list.save()
        res.redirect("/" + customListName)
      } else {
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })
})



app.post("/", (req, res) => {

  const itemName = req.body.newItem;
  const listName = req.body.list

  const item = new Item ({
    name: itemName
  })

  if (listName == "Today") {
    item.save()
    res.redirect("/")
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(item)
      foundList.save()
      res.redirect("/" + listName)
    })
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName

  if (listName == "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log("Item successfully deleted!");
        res.redirect("/")
      }
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if (!err) {
        res.redirect("/" + listName)
      }
    })
  }
})




app.get("/about", function(req, res){
  res.render("about");
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
