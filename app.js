const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const {
    redirect
} = require("express/lib/response");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));
const uri = process.env.MONGO_URL;
mongoose.connect(uri);

const itemsSchema = {
    name: String,
}
const Item = mongoose.model("Item", itemsSchema);
const listSchema = {
    name: String,
    item: [itemsSchema]
}
const List = mongoose.model("List", listSchema);
const firstItem = new Item({
    name: "Welcome to your To do list"
});
const secondItem = new Item({
    name: "hit + to add new item"
});
const thirdItem = new Item({
    name: "<--hit here to delete item"
});
const defaultItem = [firstItem, secondItem, thirdItem];

app.get("/", function(req, res) {
    Item.find(function(err, result) {
        if (result.length === 0) {
            Item.insertMany(defaultItem, function(err) {
                if (!err) {
                    res.redirect("/");
                }
            });
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: result
            });
        }
    });
});
app.post("/", function(req, res) {

    const item = req.body.newItem;
    const newitem = new Item({
        name: item
    });
    if (req.body.list === "Today") {
        newitem.save();
        res.redirect("/");
    } else {
        List.findOne({
            name: req.body.list
        }, function(err, foundlist) {
            foundlist.item.push(newitem);
            foundlist.save(function() {
                res.redirect("/" + req.body.list);
            });
        });
    }
});
app.post("/delete", function(req, res) {
    const checkedItemID = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemID, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Success");
            }
        });
        res.redirect("/");
    } else {
        List.findOneAndUpdate({
            name: listName
        }, {
            $pull: {
                item: {
                    _id: checkedItemID
                }
            }
        }, {
            new: true
        }, function(err, result) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }
});

app.get("/:customListName", function(req, res) {

    const customListName = _.capitalize(req.params.customListName);
    List.findOne({
        name: customListName
    }, function(err, foundlist) {
        if (err) {
            console.log(err);
        } else {
            if (!foundlist) {
                const list = new List({
                    name: customListName,
                    item: defaultItem
                });
                list.save(function() {
                    res.redirect("/" + customListName);
                });
            } else {
                res.render("list", {
                    listTitle: customListName,
                    newListItems: foundlist.item
                });
            }
        }
    });
});

app.get("/about", function(req, res) {
    res.render("about");
});

const port = process.env.port || 3000;
app.listen(port, function() {
    console.log("Server started on port 3000");
});
