$(function() {
  drawCode()
})

//保存注册表单Input对象
var mobileInput = $('#mobile'),
    passwdInput = $('#passwd'),
    passwdInput2 = $('#passwd2'),
    authCodeInput = $('#authcode'),
    phoneCodeInput = $('#phonecode'),
    btnSendCode = $('#btnSendCode'),
    agreeCheck = $('#agree'),
    btnSignup = $('#btnSignup'),
    signupForm = $('#signupForm');
//保存登录表单Input对象
var nameInput = $('#username'),
    passInput = $('#password'),
    btnSignIn = $('#btnSignIn'),
    signinForm = $('#signinForm');
//手机号码、密码正则表达式   
var pattern = {
    mobile: /^(13|14|15|17|18)[0-9]{9}$/,
    password: /^.{8,20}$/,
}
//错误信息提示
var message = {
    mobile: {
      required: '请输入手机号码',
      pattern: '手机号码格式不正确',
      existed: '该手机号已注册，可直接登录'
    },
    password: {
      required: '请输入密码',
      pattern: '密码长度在8-20位之间'
    },
    username: {
      required: '请输入用户名'
    }
}
//发送验证码
btnSendCode.on('click', function(e) {
  e.preventDefault()
  var status = $(this).attr('data-status');
  if(status == 0) return;
  formCheck(mobileInput, message.mobile, pattern.mobile) && sendCode()
})
//注册按钮提交
btnSignup.on('click',function(e) {
  e.preventDefault()
  signupSubmit()
})
//注册表单逐步验证
function signupSubmit() {
  formCheck(mobileInput, message.mobile, pattern.mobile) && 
  formCheck(passwdInput, message.password, pattern.password) &&
  confirmPasswd() && validateCode() && validatePhoneCode() &&
  agreeProtocol() && alert('提交')
}
//为输入框注册失去焦点事件
mobileInput.blur(function() {
  formCheck(mobileInput, message.mobile, pattern.mobile) &&
  mobileQuery(mobileInput, message.mobile)
})
passwdInput.blur(function() {
  if (formCheck(passwdInput, message.password, pattern.password)) {
    passwdInput2.attr('disabled', false)
  } else {
    passwdInput2.attr('disabled', true)
  }
  if (!passwdInput2.val() == '') {
    confirmPasswd()
  }
})
passwdInput2.blur(function() {
  if (passwdInput.val() !== '' && passwdInput2.val() !== '') {
    confirmPasswd()
  }
})
//表单验证方法
function formCheck(element, msg, pattern){
  var length = arguments.length;
  var value = $.trim($(element).val());
  var inputParent = $(element).parent();
  if(inputParent.next('.alert').length === 0) {
    inputParent.after('<p class="alert alert-warning"></p>')
  }
  if(value == '') {
    inputParent.removeClass('valid').addClass('error').next('.alert').html('<i class="fa fa-warning"></i>' + msg.required);
    $(element).focus();
    return false;
  }else{
    if(length === 3){
      if(!pattern.test(value)) {
        inputParent.removeClass('valid').addClass('error').next('.alert').html('<i class="fa fa-warning"></i>' + msg.pattern);
        $(element).focus();
        return false;
      }
    }
    inputParent.removeClass('error').addClass('valid').next('.alert').remove();
    return true;
  }
}
//异步查询手机号码
var _number;//保存号码，防止相同号码多次触发ajax事件
function mobileQuery(element, msg){
  var number = $(element).val();
  if(_number == number) return;
   _number = number;
  var inputParent = $(element).parent();
  if(inputParent.next('.alert').length === 0) {
    inputParent.after('<p class="alert alert-warning"></p>')
  }
  $.ajax({
    url: '/findByMobile',
    data: {mobile: number}
  })
  .done(function(res){
      if(res.status == 1){
        inputParent.removeClass('valid').addClass('error').next('.alert')
                   .html('<i class="fa fa-warning"></i>' + msg.existed ).show();
        btnSendCode.attr('data-status', 0)
      }
      if(res.status == 2){
        inputParent.removeClass('error').addClass('valid').next('.alert').remove();
        btnSendCode.attr('data-status', 2)
      }
  })
  .fail(function(err){
    console.log(err)
  })
}
//判断两次密码输入是否一致
function confirmPasswd() {
  var passwd = $.trim(passwdInput.val())
  var passwd2 = $.trim(passwdInput2.val())
  var inputParent = passwdInput2.parent();
  if (inputParent.next('.alert').length === 0) {
    inputParent.after('<p class="alert alert-warning"></p>')
  }
  if (passwd == '' || passwd2 == '' || passwd !== passwd2) {
    inputParent.removeClass('valid').addClass('error').next('.alert').html('<i class="fa fa-warning"></i>' + '两次密码输入不一致');
    return false;
  } else {
    inputParent.removeClass('error').addClass('valid').next('.alert').remove();
    return true;
  }
}
//绘制验证码
function drawCode() {
  var canvas = document.getElementById('canvas');
  var cxt = canvas.getContext('2d');
  cxt.clearRect(0, 0, 1000, 1000);
  cxt.font = "24px Microsoft Yahei";
  cxt.backgroundColor = '#ccc';
  cxt.fillStyle = '#444';
  cxt.fillText(createCode(), 10, 25)
}
//生成验证码
var code;
function createCode() {
  const codeLength = 4;
  const alphabet = 'abcdefghijklmnopqrstuvwxyz1234567890';
  code = '';
  for (let i = 0, len = alphabet.length; i < codeLength; i++) {
    code += alphabet.charAt(Math.floor(Math.random() * len))
  }
  return code;
}
//校验验证码
function validateCode() {
  var inputCode = authCodeInput.val().toUpperCase();
  var inputParent = authCodeInput.parents('.form-group');
  code = code.toUpperCase()
  if (inputParent.next('.alert').length === 0) {
    inputParent.after('<p class="alert alert-warning"></p>')
  }
  if (inputCode == '') {
    inputParent.removeClass('valid').addClass('error').next('.alert').html('<i class="fa fa-warning"></i>请输入验证码');
    authCodeInput.focus();
    return false;
  } else if (inputCode !== code) {
    inputParent.removeClass('valid').addClass('error').next('.alert').html('<i class="fa fa-warning"></i>验证码错误');
    authCodeInput.val('').focus();
    drawCode();
    return false;
  } else {
    inputParent.removeClass('error').addClass('valid').next('.alert').remove();
    return true;
  }
}
//判断手机验证码
function validatePhoneCode() {
  var inputParent = phoneCodeInput.parents('.form-group');
  var phonecode = $.trim(phoneCodeInput.val());
  if (inputParent.next('.alert').length === 0) {
    inputParent.after('<p class="alert alert-warning"></p>')
  }
  if (phonecode == '') {
    inputParent.removeClass('valid').addClass('error').next('.alert').html('<i class="fa fa-warning"></i>请输入手机验证码');
    authCodeInput.focus();
    return false;
  } else if (phonecode.length < 4) {
    inputParent.removeClass('valid').addClass('error').next('.alert').html('<i class="fa fa-warning"></i>验证码长度有误');
    authCodeInput.focus();
    return false;
  } else {
    inputParent.removeClass('error').addClass('valid').next('.alert').remove()
    return true;
  }
}
//发送验证码
function sendCode() {
  var count = 10;
  var timer;
  btnSendCode.attr('disabled', 'true')
  timer = setInterval(function() {
    if (count === 0) {
      clearInterval(timer);
      btnSendCode.removeAttr('disabled');
      btnSendCode.text('重新发送验证码')
    } else {
      count--;
      btnSendCode.text(count + '秒后重新获取')
    }
  }, 1000)
}
//是否同意注册协议
function agreeProtocol() {
  var inputParent = agreeCheck.parent();
  var checked = agreeCheck.prop('checked');
  if (inputParent.next('.alert').length === 0) {
    inputParent.after('<p class="alert alert-warning"></p>')
  }
  if (checked) {
    inputParent.removeClass('error').addClass('valid').next('.alert').remove();
    return true;
  } else {
    inputParent.removeClass('valid').addClass('error').next('.alert').html('<i class="fa fa-warning"></i>请同意注册协议并勾选');
    return false;
  }
}

//登录表单提交
$('#btnSignIn').on('click',function(e){
  e.preventDefault();
  if(formCheck(nameInput, message.username) && formCheck(passInput, message.password)){
    var name = nameInput.val();
    var passwd = passInput.val();
    if(signinForm.children('.fail').length === 0){
      signinForm.prepend('<p class="alert alert-warning fail"></p>');
    }
    var failPrompt = signinForm.children('.fail');
    $.ajax({
        url: '/user/signin',
        type: 'POST',
        data: {username: name, password: passwd},
      })
      .done(function(res) {
        if(res.status == 0){
          failPrompt.html('<i class="fa fa-warning"></i>用户名不存在!')
        }
        if(res.status == 1){
          failPrompt.html('<i class="fa fa-warning"></i>密码错误!')
        }
        if(res.status == 2){
          //failPrompt.html('<i class="fa fa-warning"></i>登录成功!')
          signinForm.submit()
        }
      })
      .fail(function() {
        console.log("error");
      })
  }else{
    return false;
  }
})