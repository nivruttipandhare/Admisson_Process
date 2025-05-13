let express = require("express");
let path = require("path");
let app = express();
let bodyParser = require("body-parser");
let db = require("./db");

let pubPath = path.join(__dirname, "public");

app.set("view engine","ejs");

app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(pubPath));

// Home route
app.get("/", (req, res) => {
  res.render("home.ejs");
});

// Add course form
app.get("/addcourse", (req, res) => {
  res.render("addcourse.ejs", { msg: "" });
});

// Save course
app.post("/save", (req, res) => {
  let { cname } = req.body;
  db.query("INSERT INTO course (cname) VALUES (?)", [cname], (err, result) => {
    if (err) {
      console.error("Error is", err);
      return res.render("addcourse.ejs", { msg: "❌ Error Adding Course" });
    }

    res.render("addcourse.ejs", { msg: "✔ Course Added Successfully" });
  });
});

// View course
app.get("/viewcourse", (req, res) => {
  db.query("SELECT * FROM course", (err, result) => {
    if (err) {
      console.log("Error is", err);
      return res.send("Error loading page");
    }
    res.render("viewcourse.ejs", { data: result });
  });
});

//delete course
app.get("/delbyId",(req, res)=>{
  let courseId=parseInt(req.query.courseId.trim());
  db.query("delete from course where cid=?",[courseId],(err, result)=>{
    db.query("select *from course",(err, result)=>{
        if(err){
          res.render("viewcourse.ejs");
        }else{
          res.render("viewcourse.ejs",{data:result});
        }
    })
  })
})

// update course

app.get("/update", (req, res) => {
  let courseId = parseInt(req.query.courseId);
  console.log("GET courseId:", courseId);

  db.query("SELECT * FROM course WHERE cid = ?", [courseId], (err, result) => {
    if (err) {
      console.error("Error accessing course for update", err);
      return res.redirect("/viewcourse");
    }

    if (result.length === 0) {
      console.warn("No course found with cid =", courseId);
      return res.redirect("/viewcourse");
    }

    res.render("updatecourse.ejs", { data: result[0] });
  });
});

// POST: Handle form submission
app.post("/update", (req, res) => {
  const { cid, cname } = req.body;
  if (!cid || !cname) return res.redirect("/viewcourse");

  db.query("UPDATE course SET cname = ? WHERE cid = ?", [cname, cid], (err) => {
    if (err) console.error("Update Error:", err);
    res.redirect("/viewcourse");
  });
});

// Add Student Route (GET)
app.get("/addstudent", (req, res) => {
  db.query("SELECT * FROM course", (err, result) => {
    if (err) {
      console.error("Error loading courses:", err);
      return res.render("addstudent.ejs", { msg: "❌ Error loading courses", data: [] });
    }

    res.render("addstudent.ejs", { msg: "", data: result });
  });
});
//
app.post("/savestudent", (req, res) => {
  const { sname, semail, scontact, cid } = req.body;

  if (!sname || !semail || !scontact || !cid) {
    return db.query("SELECT * FROM course", (err, result) => {
      res.render("addstudent.ejs", { msg: "❌ All fields are required.", data: result || [] });
    });
  }

  db.query("INSERT INTO cstudent (sname, email, contact, cid) VALUES (?, ?, ?, ?)",
    [sname, semail, scontact, cid],
    (err) => {
      const msg = err ? "❌ Error adding student." : "✅ Student added successfully!";
      db.query("SELECT * FROM course", (err2, result2) => {
        res.render("addstudent.ejs", { msg, data: result2 || [] });
      });
    }
  );
});

// View Student 
app.get("/viewstudent", (req, res) => {
  console.log("Fetching student data...");

  db.query("SELECT s.sid, s.sname, s.email, s.contact, c.cname FROM cstudent s INNER JOIN course c ON s.cid = c.cid", (err, result) => {
    if (err) {
      console.error("Error fetching students:", err);
      return res.send("Error fetching student data.");
    }

    console.log("Query result:", result); // Log result to see the data

    if (!result || result.length === 0) {
      console.warn("No student data found.");
      return res.render("viewstudent.ejs", { data: [] }); // Pass empty array to render the table correctly
    }

    res.render("viewstudent.ejs", { data: result });
  });
});

//delete stud
app.get("/deletestud", (req, res) => {
  const sid = req.query.sid;
  db.query("DELETE FROM cstudent WHERE sid = ?", [sid], (err, result) => {
      if (err) {
          console.error("Error deleting student:", err);
          return res.send("Error deleting student");
      }
      res.redirect("/viewstudent"); // After deletion, redirect to view students page
  });
});


// Update Student Details
app.get("/updatestud", (req, res) => {
  const sid = req.query.sid;
  if (!sid) return res.redirect("/viewstudent");

  db.query("SELECT * FROM cstudent WHERE sid = ?", [sid], (err, studentResult) => {
    if (err || studentResult.length === 0) {
      console.error("Student fetch error:", err);
      return res.redirect("/viewstudent");
    }

    db.query("SELECT * FROM course", (err, courseResult) => {
      if (err) {
        console.error("Course fetch error:", err);
        return res.redirect("/viewstudent");
      }

      res.render("updatestudent.ejs", {
        student: studentResult[0],
        courses: courseResult,
      });
    });
  });
});

// Handle student update via POST request
// Handle student update via POST request
app.post("/updatestud", (req, res) => {
  const { sid, sname, email, contact, cid } = req.body;

  db.query(
    "UPDATE cstudent SET sname = ?, email = ?, contact = ?, cid = ? WHERE sid = ?",
    [sname, email, contact, cid, sid],
    (err, result) => {
      if (err) {
        console.error("Error updating student:", err);
        return res.redirect("/viewstudent");
      }
      res.redirect("/viewstudent"); // Redirect to view student after successful update
    }
  );
});

app.get('/coursewisestudent',(req,  res)=>{
  db.query("SELECT c.cname AS Course_Name, s.sid AS Student_ID, s.sname AS Student_Name FROM course c INNER JOIN cstudent s ON c.cid = s.cid ORDER BY c.cname, s.sname",(err, result)=>{
    if(err){
      console.log("Error is ",err);
      return res.send("Error Loading");
    }
     res.render('coursewisestudent.ejs',{data:result});
  })
   
})
// Course Count
app.get("/coursecount", (req, res) => {
  db.query("SELECT c.cname AS Course_Name, COUNT(s.sid) AS total_stud FROM course c LEFT JOIN cstudent s ON c.cid = s.cid GROUP BY c.cname ORDER BY total_stud DESC", (err, result) => {
    if (err) {
      console.log("Error is ", err);
    }
    res.render("coursecount.ejs", { data: result });
  });
});
  //ports 
app.listen(4000, () => {
  console.log("Server started on port 4000");
});
