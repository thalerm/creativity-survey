const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const cors = require("cors");
const { Pool } = require('pg');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { RSA_SSLV23_PADDING } = require('constants');
const pgSession = require('connect-pg-simple')(session);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err) // your callback here
  process.exit(-1)
})

//https://github.com/voxpelli/node-connect-pg-simple

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(express.urlencoded({
    extended: true
  }))
  .use(express.json({limit: '50mb'})) // set filesize limit to 50 mb
  .use(cors())
  .use(cookieParser())
  .use(session({
    store: new pgSession({
      pool : pool,                // Connection pool
      tableName : 'session'   // Use another table-name than the default "session" one
    }),
    secret: process.env.FOO_COOKIE_SECRET,
    resave: false
  }))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/rate', (req, res) => res.render('pages/rate'))
  .get('/view', (req, res) => res.render('pages/view'))
  .get("/api/example", async (req, res) =>{
    try {
      const sess_id = req.sessionID;
      const client = await pool.connect();
      var expgroup = 0;
      await client.query("select exp_group from survey where sess_id='"+sess_id+"';")
      .then(result =>{
        result.rowCount==0 ? expgroup=0 : expgroup=result.rows[0].exp_group;
        console.log(result.rows[0].exp_group);
      })
      .catch(e => console.error(e.stack));

      
      // determine new experimental group if it is 0

      console.log("first check: "+expgroup);
      if (expgroup!=0){
        res.json({exp_group: expgroup, first_id: req.sessionID});
      } else {
        await client.query('select sum(case when exp_group = 1 then 1 else 0 end) group_1, sum(case when exp_group = 2 then 1 else 0 end) group_2, sum(case when exp_group = 3 then 1 else 0 end) group_3 from survey where submit = true;')
        .then(result =>{
          const group1=result.rows[0].group_1;
          const group2=result.rows[0].group_2;
          const group3=result.rows[0].group_3;
          if (group3 <= group1 && group3 <= group2) {
            expgroup = 3;}
          else {
            if (group1 <= group2) {
              expgroup = 1;
            } else {
              expgroup = 2; 
            }
          }
          console.log("second check: " + expgroup);
        })
        .catch(e => {
          client.release();
          console.error(e.stack);
        });
        await client.query(
          "insert into survey (sess_id, first_id, exp_group) values ($1, $2, $3);",
          [sess_id, sess_id, expgroup]
        )
        .then(result => {
          client.release();
          res.json({exp_group: expgroup, first_id: sess_id});
        })
        .catch(e => {
          client.release();
          res.sendStatus(400);
          console.error(e.stack);
        });
        
      }
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .post("/api/drawing", async (req, res) =>{
    const { drawing, description, time_remaining, exp_group, first_id } = req.body;
    const sess_id = req.sessionID;
    console.log(sess_id, drawing, description, time_remaining, exp_group, first_id);
    const client = await pool.connect();
    await client.query(
      "insert into drawings (sess_id, first_id, exp_group, drawing, descr, time_remaining) values ($1, $2, $3, $4, $5, $6);",
      [sess_id, first_id, exp_group, drawing, description, time_remaining]
    )
    .then(result => {
      client.release();
      res.sendStatus(201);
    })
    .catch(e => {
      client.release();
      console.error(e.stack);
    });
  })
  .post("/api/survey", async (req, res) =>{
    const { first_id, exp_group, inspq1, inspq2, inspq3, inspq4, inspq5, gender, creativity, background, occupation, education, age } = req.body;
    const sess_id = req.sessionID;
    console.log(first_id, exp_group, inspq1, inspq2, inspq3, inspq4, inspq5, gender, age, background, occupation, education, creativity);
    const client = await pool.connect();
    const result = await client.query(
      "update survey set sess_id=$1, first_id=$2, exp_group=$3, inspq1=$4, inspq2=$5, inspq3=$6, inspq4=$7, inspq5=$8, creativity=$9, background=$10, occupation=$11, education=$12, gender=$13, age=$14 where first_id='"+first_id+"';",
      [sess_id, first_id, exp_group, inspq1, inspq2, inspq3, inspq4, inspq5, creativity, background, occupation, education, gender, age])
    .then(result => {
      client.release();
      res.sendStatus(201);
    })
    .catch(e => {
      client.release();
      console.error(e.stack);
    });
  })
  .put("/api/submit", async (req, res) =>{
    const { first_id, submitted } = req.body;
    var mturk = first_id.substring(first_id.length - 6);
    console.log(first_id, submitted);
    var success = 0;
    const client = await pool.connect();
    await client.query(
      "update survey set submit='"+submitted+"' where first_id='"+first_id+"';")
    .then(result =>{
      client.release();
      result.rowCount==0 ? success = false : success = true;
    })
    .catch(e => {
      client.release();
      console.error(e.stack);
    });
    res.json({code: mturk});
  })
  .get('/api/view', async (req, res) => {
    var drawing_id = req.query.id;
    const client = await pool.connect();
    await client.query("select * from drawings LEFT JOIN survey ON drawings.first_id=survey.first_id where drawings.id = "+drawing_id+";")
    .then(result => {   
      client.release();     
      res.json(result.rows[0]);
    })
    .catch(e => {
      client.release();
      console.error(e.stack);
    });
  })
  .get("/api/rate_drawing", async (req, res) =>{
    try{
      const img_id = req.query.img_id;
      const rater_id = req.query.rater_id;
      if (rater_id == "markus"){
        const client = await pool.connect();
        await client.query("select * from drawings_clean where id = "+img_id+";")
        .then(result => {
          client.release();      
          res.json(result.rows[0])
          console.log(result.rows);
        })
        .catch(e => {
          client.release();
          console.error(e.stack);
        });
      } else {
        throw new Error("Not a valid rater.");
      }
    } catch (err) {
      console.error(err);
      return res.send("Error " + err);
    }
  })
  /*
  .put("/api/rate_drawing", async (req, res) =>{
    const { rater_id, drawing_id, q1, q2 } = req.body;
    console.log(rater_id, drawing_id, q1, q2);
    var success = true;
    const client = await pool.connect();
    await client.query(
      "update rate_drawings set q1='"+q1+"', q2='"+q2+"' where rater_id='"+rater_id+"' AND drawing_id='"+drawing_id+"';")
    .then(result =>{
      result.rowCount==0 ? success = false : success = true;
    })
    .catch(e => console.error(e.stack));
    console.log(success);
    if (success == false){
      await client.query(
        "insert into rate_drawings (rater_id, drawing_id, q1, q2) values ('"+rater_id+"', '"+drawing_id+"', '"+q1+"', '"+q2+"');")
      .catch(e => console.error(e.stack));
    }
    res.sendStatus(201);
    client.release();
  }) */
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))


