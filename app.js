const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const app = express();
const keys = require("./config/keys");
const tools = require("./comm/tools");

//允许跨域
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  if (req.method == 'OPTIONS') {
    res.send(200);
  } else {
    next();
  }
});

// session
app.use(session({
  secret: keys.sessionOrKey,
  resave: false,
  saveUninitialized: true,
  cookie: {
    // secure: true,
    maxAge: 1000 * 60 * 30, // 设置 session 的有效时间，单位毫秒
  }
}))

// 使用body-parser中间件
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

//设置静态公共目录
app.use(express.static(__dirname + "/public"));

//文件目录权限控制
app.use("/uploads", (req, res, next) => {
  if (!req.session.userid) {
    return res.redirect("/users/login");
  }
  next();
}, express.static(__dirname + "/uploads"));

//art-template
app.set('view cache', false);
app.set('views', './views');
app.set('view engine', 'html');
app.engine('html', require('express-art-template'));
app.set('view options', {
  debug: process.env.NODE_ENV !== 'production'
});

// 使用routes
app.use("/", require("./routes/index/index"))
app.use("/main", require("./routes/main/pages"));
app.use("/users", require("./routes/main/users"));

app.use("/admin/pages", require("./routes/admin/pages"));
app.use("/admin/users", require("./routes/admin/users"));

app.use("/api/base/comm", require("./routes/api/base/comm"));
app.use("/api/base/reload", require("./routes/api/base/reload"));
app.use("/api/main/users", require("./routes/api/main/users"));
app.use("/api/main/doc", require("./routes/api/main/doc"));

app.use("/api/admin/pages", require("./routes/api/admin/pages"));
app.use("/api/admin/users", require("./routes/api/admin/users"));
app.use("/api/admin/comm", require("./routes/api/admin/comm"));

app.use("/upload", require('./routes/upload/upload'));

// catch 404
app.use((req, res, next) => {
  let err = new Error("Not Found");
  err.status = 404;
  next(err);
})
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render("main/error/error", {
    message: err.message,
    error: {
      status: err.status,
      desc: "不好意思你的页面被狗叼走了！"
    }
  });
})

// Connect  Server
mongoose.connect(keys.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("数据库连接成功！")
    //启动服务器
    const port = process.env.PORT || 5000;
    const IP = tools.getIPAdress();
    app.listen(port, () => {
      console.log('服务器启动成功:' + IP + ':' + port);
    })
  })
  .catch(err => console.log(err));