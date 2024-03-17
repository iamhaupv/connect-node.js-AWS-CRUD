// check studentId
function checkInputStudentId() {
  // xử lý không được để trống
  // studentId
  const studentId = document.getElementById("studentId").value.trim();
  const validStudentId = /^\d*$/;
  if (!studentId) {
    document.getElementById("erStudentId").innerHTML = "Không được để trống";
    return false;
  } else if (!validStudentId.test(studentId)) {
    document.getElementById("erStudentId").innerHTML =
      "Chỉ được nhập số nguyên dương lớn hơn 0";
    return false;
  } else {
    document.getElementById("erStudentId").innerHTML = "";
    return true;
  }
}
// check image
function checkFileImage() {
  const image = document.getElementById("image");
  const file = image.files[0];
  if (!file) {
    document.getElementById("erImage").innerHTML = "Bạn chưa chọn file!";
    return false;
  } else {
    document.getElementById("erImage").innerHTML = "";
    return true;
  }
}
// check name
function checkInputName() {
  // xử lý không được để trống
  const name = document.getElementById("name").value.trim();
  const validName = /^[A-Z][a-z]*(\s[A-Z][a-z]*)*$/;
  if (!name) {
    document.getElementById("erName").innerHTML = "Không được để trống";
    return false;
  } else if (!validName.test(name)) {
    document.getElementById("erName").innerHTML =
      "Tên không hợp lệ!(Vd: Phạm Văn Hậu)";
    return false;
  } else {
    document.getElementById("erName").innerHTML = "";
    return true;
  }
}
// check email
function checkInputEmail() {
  // xử lý không được để trống
  const name = document.getElementById("email").value.trim();
  const validName = /^[a-zA-Z_]\w*@gmail.com$/;
  if (!name) {
    document.getElementById("erEmail").innerHTML = "Không được để trống";
    return false;
  } else if (!validName.test(name)) {
    document.getElementById("erEmail").innerHTML =
      "Email không hợp lệ!(Vd: phamvanhau@gmail.com)";
    return false;
  } else {
    document.getElementById("erEmail").innerHTML = "";
    return true;
  }
}
// check address
function checkInputAddress() {
  // xử lý không được để trống
  const name = document.getElementById("address").value.trim();
  const validName = /^[a-zA-Z0-9\s,'-]*$/;
  if (!name) {
    document.getElementById("erAddress").innerHTML = "Không được để trống";
    return false;
  } else if (!validName.test(name)) {
    document.getElementById("erAddress").innerHTML =
      "Address không hợp lệ!(Vd: Phu Yen)";
    return false;
  } else {
    document.getElementById("erAddress").innerHTML = "";
    return true;
  }
}
// check tuition
function checkInputTuition() {
  // xử lý không được để trống
  const tuition = document.getElementById("tuition").value.trim();
  const validTuition = /^\d*$/;
  if (!tuition) {
    document.getElementById("erTuition").innerHTML = "Không được để trống";
    return false;
  } else if (!validTuition.test(tuition)) {
    document.getElementById("erTuition").innerHTML =
      "Chỉ được nhập số nguyên dương lớn hơn 0!";
    return false;
  } else {
    document.getElementById("erTuition").innerHTML = "";
    return true;
  }
}
function checkInput() {
  if (
    !checkInputStudentId()
    || checkFileImage ||
    !checkInputName() ||
    !checkInputEmail() ||
    !checkInputTuition() ||
    !checkInputAddress()
  )
    return false;
  return true;
}
