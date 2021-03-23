"use strict"
const fs = require('fs');
const http = require('http');
const url = require('url');
const qstring = require('querystring');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;

http.createServer(function (req, res) {
	
	const urlObj = url.parse(req.url, true, false);  
	
	if (urlObj.pathname.endsWith('pizza_shanty'))
	{
		//Read the file pizza_shanty.html from the disk and send
		//as the response.
		//
		//See Listing 7.1 in your book. 
		fs.readFile("./pizza_shanty.html", (err, page) => {
			console.log("Request received");
			if (err) {
				res.writeHead(404);
                res.write("Contents you are looking are Not Found");
				res.end();
			}
			else {
				res.writeHead(200, { "Content-Type": "text/html" });
                res.write(page);
				res.end();
			}
		});
		
	}
	else if (urlObj.pathname.endsWith('pizza_shanty_save'))
	{
		//Both parts of this are tricky
		
		//1. Parse the POST data.  In has to be post.
		// 	You will need to use the data and end events as shown in 
		//	listing 7.4 in your book
		//  You will then need to turn the URL string into a JSON object
		//  using the QueryString object (bottom of page 117).
		
		let body = "";
		let obj2 = { crust_type: "null", crust_size: "null", extra_cheese: false, address: "null", total_price: 0.00, toppings: []};
		req.on("data", chunk => {
			body += chunk.toString();
		});
		req.on("end", () => {
			let obj1 = qstring.parse(body);
			//reformat obj to insert into pizza_shanty_db
			if (obj1.extra_cheese === "Extra") obj2.extra_cheese = true;
			for (var p in obj1) {
				if (p === "Pepperoni" || p === "Hamburger" || p === "Onion" || p === "Mushroom" || p === "Turkey") {
					obj2.toppings.push(p);
				}
			}
			obj2.crust_type = obj1.crust_type;
			obj2.crust_size = obj1.crust_size;
			obj2.address = obj1.streetAddress;
			obj2.total_price = obj1.total_price;
			MongoClient.connect("mongodb://pizza_user:pizza_user@localhost:4096/pizza_shanty_db", (err, db) => {
				if (err) console.log(err.message);
				else {
					var myDB = db.db("pizza_shanty_db");
					//Get the collection
					myDB.collection("pizzas", (err, collection) => {
						if (err) console.log(err.message);
						else {
							collection.insertOne(obj2, (err, result) => {
								if (err) {
									console.log(err.message);
								}
								else {
									console.log("Inserted : ");
									console.log(result);
								}
							});
						}
					});
					//logout
					db.logout((err, result) => {
						if (!err) {
							console.log("Logged out via client object");
						}
						db.close();
						console.log("Connection closed...");
					});
					
					
				}
			});
			
			printDescription();
		});
		
		function printDescription() {
			//display info for order
			res.setHeader("Content-Type", "text/html");
			res.writeHead(200);
			res.write("<html><head>\n");
			res.write("<style>\n");
			res.write("body {\nbackground-color: ivory;\ncolor: black;\n}\n");
			res.write("div {\nbackground-color: salmon;\nmargin: auto;\n}\n");
			res.write("</style>\n");
			res.write("<title>Pizza Shanty Save</title></head>\n");
			res.write("<body>\n");
			res.write("<div>\n");
			res.write("<h1>Your pizza is on it's way</h1>\n");
			//res.write(obj2.crust_size + " " + obj2.crust_type + " pizza");
			res.write("<td>" + getDescription(obj2) + "</td>\n");
			res.write("</div>");
			res.end("</body>\n</html>\n");
		}
		
		// To write to the server you will need to have the database 
		// created (pizza_shanty_db) and the collection (pizzas).
		//2. Write the JSON object to the database.
		//  a. Connect to the server.  Tricky with authentication.
		//  b. Get the database (pizza_shanty_db)
		//  c. Get the collection (pizzas)
		//  d. insert the object using insertOne(). Plain insert wont work.
	} 
	else if (urlObj.pathname.endsWith('pizza_shanty_view'))
	{		
		//Read the database collection.  
		//Write to the response in table form with a delete checkbox.
		//You will need some unique identifier.  Use the document ID.
		
		
		
		MongoClient.connect("mongodb://pizza_user:pizza_user@localhost:4096/pizza_shanty_db",
			(err, db) => {
				if (err) {
					console.log(err.message);
				} 
				else {
					var myDB = db.db("pizza_shanty_db");
					//Get the collection
					myDB.collection("pizzas", (err, collection) => {
						if (err) {
							console.log(err.message);
						}
						else {
							//find items in collection
							collection.find((err, items) => {
								if (err) {
									console.log(err.message);
								}
								else {
									//put items in array
									items.toArray((err, itemArr) => {
										if (err) {
											console.log(err.message);
										}
										else {
											//display table of orders
											res.setHeader("Content-Type", "text/html");
											res.writeHead(200);
											res.write("<html><head>\n");
											res.write("<style>");
											res.write("body {\nbackground-color: ivory;\ncolor: black;\n}\n");
											res.write("table {\nbackground-color: salmon;\ncolor: black;\nborder: 4px solid black;\n}\n");
											res.write("td {\nborder: 1px solid black;\n}\n");
											res.write("</style>");
											res.write("<title>Pizza Shanty View</title></head>\n");
											res.write("<body>\n");
											res.write("<table>\n");
											
											res.write("<tr>\n");
											res.write("<td>Delete</td>");
											res.write("<td>Order Number</td>");
											res.write("<td>Address</td>");
											res.write("<td>Price</td>");
											res.write("<td>Description</td>");
											res.write("</tr>\n");
											
											res.write("<form method='post' action='/node90/pizza_shanty_delete'>");
											
											itemArr.forEach((item) => {
												res.write("<tr>\n");
												res.write("<td><input type='checkbox' name='" + item._id +  "' value='" + item._id + "'></td>\n");
												res.write("<td>" + item._id + "</td>\n");
												res.write("<td>" + item.address + "</td>\n");
												res.write("<td>" + item.total_price + "</td>\n");
												res.write("<td>" + getDescription(item) + "</td>\n");
												res.write("</tr>\n");
											});
											
											res.write("</table>\n");
											
											res.write("<input type='submit' name='deleteButton' value='Delete'>");
											res.write("<input type='submit' name='deleteButton' value='Delete All'>");
											res.write("</form>");
											
											res.end("</body>\n</html>\n");
										}
									});
								}
							});
						}
					});
					//logout
					db.logout((err, result) => {
						if (!err) {
							console.log("Logged out via client object");
						}
						db.close();
						console.log("Connection closed...");
					});
				}
			}
		);
	}
	else if (urlObj.pathname.endsWith('pizza_shanty_delete'))
	{		
		//Read the database collection.  
		//Delete the appropriate items.
		
		let body = "";
		req.on("data", chunk => {
			body += chunk.toString();
		});
		req.on("end", () => {
			let obj1 = qstring.parse(body);
			
			MongoClient.connect("mongodb://pizza_user:pizza_user@localhost:4096/pizza_shanty_db", (err, db) => {
				if (err) console.log(err.message);
				else {
					var myDB = db.db("pizza_shanty_db");
					//Get the collection
					myDB.collection("pizzas", (err, collection) => {
						if (err) console.log(err.message);
						else {
							//delete selected items
							//console.log(obj1);
							if (obj1.deleteButton === "Delete") {
								
								let objArr = [];
								for (var item in obj1) {
									if (item !== "deleteButton") {
										objArr.push(ObjectId(item));
									}
								}
								collection.remove({_id: {$in: objArr}}, (err) => {
									if (err) {
										console.log(err.message);
									}
								});
							}
							//delete all items
							else if (obj1.deleteButton === "Delete All") {
								collection.remove({extra_cheese:true}, (err) => {
									if (err) {
										console.log(err.message);
									}
								});
								collection.remove({extra_cheese:false}, (err) => {
									if (err) {
										console.log(err.message);
									}
								});
							}
							//find items in collection
							collection.find((err, items) => {
								if (err) {
									console.log(err.message);
								}
								else {
									//put items in array
									items.toArray((err, itemArr) => {
										if (err) {
											console.log(err.message);
										}
										else {
											//display table of orders
											res.setHeader("Content-Type", "text/html");
											res.writeHead(200);
											res.write("<html><head>\n");
											res.write("<style>");
											res.write("body {\nbackground-color: ivory;\ncolor: black;\n}\n");
											res.write("table {\nbackground-color: salmon;\ncolor: black;\nborder: 4px solid black;\n}\n");
											res.write("td {\nborder: 1px solid black;\n}\n");
											res.write("</style>");
											res.write("<title>Pizza Shanty View</title></head>\n");
											res.write("<body>\n");
											res.write("<table>\n");
											
											res.write("<tr>\n");
											res.write("<td>Delete</td>");
											res.write("<td>Order Number</td>");
											res.write("<td>Address</td>");
											res.write("<td>Price</td>");
											res.write("<td>Description</td>");
											res.write("</tr>\n");
											
											res.write("<form method='post' action='/node90/pizza_shanty_delete'>");
											
											itemArr.forEach((item) => {
												res.write("<tr>\n");
												res.write("<td><input type='checkbox' name='" + item._id +  "' value='" + item._id + "'></td>\n");
												res.write("<td>" + item._id + "</td>\n");
												res.write("<td>" + item.address + "</td>\n");
												res.write("<td>" + item.total_price + "</td>\n");
												res.write("<td>" + getDescription(item) + "</td>\n");
												res.write("</tr>\n");
											});
											
											res.write("</table>\n");
											
											res.write("<input type='submit' name='deleteButton' value='Delete'>");
											res.write("<input type='submit' name='deleteButton' value='Delete All'>");
											res.write("</form>");
											
											res.end("</body>\n</html>\n");
										}
									});
								}
							});
						}
					});
					//logout
					db.logout((err, result) => {
						if (!err) {
							console.log("Logged out via client object");
						}
						db.close();
						console.log("Connection closed...");
					});
					
					
				}
			});
			
		});
	}
	else 
	{		
		res.writeHead(404); 
		res.write('<html><head><title>Pizza Shanty</title></head>\n');
		res.write('<body>\n');
		res.write('<h1>Resource not found<h1>');
		res.end('\n</body>\n</html>\n');			  
		res.end();
		return;
	}	
}).listen(3090);

function getDescription(item) {
	let line = "";
	//extra cheese
	if (item.extra_cheese) {
		line += "Extra Cheese ";
	}
	//size and type
	line += item.crust_size + " " + item.crust_type + " Pizza";
	//toppings
	if (!(item.toppings.length === 0)) {
		line += " with";
		for (let i = 0; i < item.toppings.length; i++) {
			if (i === 0) {
				line += " " + item.toppings[i];
			}
			else {
				line += ", " + item.toppings[i];
			}
		}
	}
	return line;
}

