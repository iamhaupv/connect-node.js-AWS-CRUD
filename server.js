const express = require("express");
const app = express();
const AWS = require("aws-sdk"); // lib service aws
const multer = require("multer"); // lib quản lý upload image
require("dotenv").config(); // sử dụng biến môi trường
const path = require("path");
const port = process.env.PORT; // port để chạy trang web
// config view engine
app.set("view engine", "ejs");
app.set("views", "./views");
// config middleware
app.use(express.urlencoded({ extended: true }));
// config static files
app.use(express.static("./views"));
// config aws
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = "1"; // Hạn chết những thông báo bảo trì cho js khi sử dụng các service của aws
// config aws-sdk
AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});
// service s3
const s3 = new AWS.S3();
// service dynamodb
const dynamodb = new AWS.DynamoDB.DocumentClient();
// bucket name
const bucketName = process.env.S3_BUCKET_NAME; // tên bucket lưu image trên s3
// table name
const tableName = process.env.DYNAMODB_TABLE_NAME; // tên table trên dynamodb
// config upload image
const storage = multer.memoryStorage({
  destination(req, file, cb) {
    cb(null, "");
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2000000 }, // giới hạn kích thước file là 2000000
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
});
function checkFileType(file, cb) {
  const fileType = /jpeg|png|jpg|gif/; // chỉ nhận những file có đuôi .jpeg, .png, .jpg, .gif
  const extname = fileType.test(path.extname(file.originalname).toLowerCase()); // toLowerCase không phân biệt hoa thường, originalname là tên gốc của tệp tin khi người dùng up lên trình duyệt, extname là một phần của module path nó trích xuât phần mở rộng của tệp tin
  const mimetype = fileType.test(file.mimetype); // mimetype là một chuổi được sử dụng để chỉ định loại nội dung của file hoặc dữ liệu trong môi trường internet
  if (extname && mimetype) {
    return cb(null, true); // ok
  }
  return cb("Error jpeg|png|jpg|gif");
}
// router
// home
app.get("/", (req, res) => {
  res.send("Hello");
});
// page phamvanhau
app.get("/phamvanhau", async (req, res) => {
  // async await là cơ chế quản lý bất đồng bộ, khi xử lý tác vụ nó tạo ra promise và chờ cho promise được xử lý xong thì mới thực thi tiếp
  try {
    const params = {
      TableName: tableName, // lấy tên table trên dynamodb
    };
    const data = await dynamodb.scan(params).promise(); // scan lấy toàn bộ dữ liệu trong table trên dynamodb
    console.log(data.Items);
    return res.render("index.ejs", { data: data.Items }); // render dữ liệu qua form
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});
app.get("/edit", async (req, res) => {
  try {
    const studentId = req.query.studentId;
    const params = {
      TableName: tableName,
      Key: {
        studentId: Number(studentId),
      },
    };
    const data = await dynamodb.get(params).promise();
    console.log(data.Item);
    return res.render("edit.ejs", { data: data.Item });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});
// method
// delete
app.post("/delete", upload.fields([]), async (req, res) => {
  const listCheckBoxSelected = Object.keys(req.body); // là đối tượng chứa các cặp key-value
  if (!listCheckBoxSelected || listCheckBoxSelected.length <= 0)
    return res.redirect("/phamvanhau");
  try {
    function onDeleteItems(length) {
      const params = {
        TableName: tableName,
        Key: {
          studentId: Number(listCheckBoxSelected[length]), // lấy key để xóa
        },
      };
      dynamodb.delete(params, (err, data) => {
        if (err) {
          console.log(err);
          return res.send("Internal Server Error!");
        } else if (length > 0) return onDeleteItems(length - 1); // đệ quy
        return res.redirect("/phamvanhau");
      });
    }
    onDeleteItems(listCheckBoxSelected.length - 1); // đệ quy
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});
// save
app.post("/save", upload.single("image"), (req, res) => {
  // upload single chỉ xử lý fied có name là image
  try {
    // lấy tất cả giá trị trên form
    const studentId = Number(req.body.studentId);
    const name = req.body.name;
    const email = req.body.email;
    const address = req.body.address;
    const tuition = req.body.tuition;
    const image = req.file.originalname.split("."); // tạo ra mảng image chứa các chứa các thành phần sau khi được tách bằng . vd avt.jpg [avt, jgp]
    const fileType = image[image.length - 1]; // lấy phần tử cuối cùng của mảng img tức là lấy phần mở rộng của file
    const filePath = `${studentId}_${Date.now().toString()}.${fileType}`; // tên của ảnh trên s3 id_ngaygiohientai.phanmorongcuafile
    const paramsS3 = {
      Bucket: bucketName,
      Key: filePath,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };
    s3.upload(paramsS3, async (err, data) => {
      const imageURL = data.Location; // chứa url của tập tin sau khi được up lên s3
      console.log(imageURL);
      const paramsDynamoDB = {
        TableName: tableName,
        Item: {
          studentId: Number(studentId),
          name: name,
          email: email,
          address: address,
          tuition: tuition,
          image: imageURL,
        },
      };
      await dynamodb.put(paramsDynamoDB).promise();
      return res.redirect("/phamvanhau");
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});
// update
// app.post("/edit", upload.single("image"), async (req, res) => {
//   try {
//     // Lấy thông tin từ form chỉnh sửa
//     const studentId = Number(req.body.upstudentId);
//     const name = req.body.upname;
//     const email = req.body.upemail;
//     const address = req.body.upaddress;
//     const tuition = Number(req.body.uptuition);

//     // Xử lý hình ảnh nếu có
//     let imageURL = req.body.imgae; // Giả sử bạn có trường hidden input để lưu đường dẫn hình ảnh cũ
//     if (req.file) {
//       const image = req.file.originalname.split(".");
//       const fileType = image[image.length - 1];
//       const filePath = `${studentId}_${Date.now().toString()}.${fileType}`;
//       const paramsS3 = {
//         Bucket: bucketName,
//         Key: filePath,
//         Body: req.file.buffer,
//         ContentType: req.file.mimetype,
//       };
//       const data = await s3.upload(paramsS3).promise();
//       imageURL = data.Location;
//     }

//     // Cập nhật thông tin sinh viên trong DynamoDB
//     const params = {
//       TableName: tableName,
//       Key: {
//         studentId: Number(studentId),
//       },
//       UpdateExpression: "SET #n = :name, #e = :email, #a = :address, #t = :tuition, #i = :image",
//       ExpressionAttributeNames: {
//         "#n": "name",
//         "#e": "email",
//         "#a": "address",
//         "#t": "tuition",
//         "#i": "image",
//       },
//       ExpressionAttributeValues: {
//         ":name": name,
//         ":email": email,
//         ":address": address,
//         ":tuition": Number(tuition),
//         ":image": imageURL,
//       },
//       ReturnValues: "UPDATED_NEW",
//     };

//     const data = await dynamodb.update(params).promise();
//     console.log("Update successful:", data);

//     return res.redirect("/phamvanhau");
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send("Internal Server Error!");
//   }
// });
app.post("/edit", upload.single("oldImage"), async (req, res) => {
  try {
    // Lấy thông tin từ form chỉnh sửa
    const studentId = Number(req.body.upstudentId);
    const name = req.body.upname;
    const email = req.body.upemail;
    const address = req.body.upaddress;
    const tuition = Number(req.body.uptuition);

    // Xử lý hình ảnh nếu có
    let imageURL = req.body.oldImage; // Giả sử bạn có trường hidden input để lưu đường dẫn hình ảnh cũ
    if (req.file) {
      const image = req.file.originalname.split(".");
      const fileType = image[image.length - 1];
      const filePath = `${studentId}_${Date.now().toString()}.${fileType}`;
      const paramsS3 = {
        Bucket: bucketName,
        Key: filePath,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      const data = await s3.upload(paramsS3).promise();
      imageURL = data.Location;
    }

    // Cập nhật thông tin sinh viên trong DynamoDB
    const params = {
      TableName: tableName,
      Key: {
        studentId: Number(studentId),
      },
      UpdateExpression: "SET #n = :name, #e = :email, #a = :address, #t = :tuition",
      ExpressionAttributeNames: {
        "#n": "name",
        "#e": "email",
        "#a": "address",
        "#t": "tuition",
      },
      ExpressionAttributeValues: {
        ":name": name,
        ":email": email,
        ":address": address,
        ":tuition": tuition,
      },
    };

    if (imageURL) {
      params.UpdateExpression += ", #i = :image";
      params.ExpressionAttributeNames["#i"] = "image";
      params.ExpressionAttributeValues[":image"] = imageURL;
    }

    const data = await dynamodb.update(params).promise();
    console.log("Update successful:", data);

    return res.redirect("/phamvanhau");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});



// listen
app.listen(port, () => {
  console.log(`Example app on for port ${port}`);
});
