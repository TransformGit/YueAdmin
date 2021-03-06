/** 部门管理 **/
//部门组织树
const organizeTree = $('#organizeTree');
//企业ID
const partnerId = organizeTree.data('partner');
//角色对应功能节点树
const roleFunctionTree = $('#roleFunctionTree');
//部门ID
const departmentId = $('#departmentId');
//部门名称
const departmentName = $('#departmentName');
//权限列表对象
const roleList = $('#roleList');
//权限条目
const roleItem = roleList.children('li').not('.active');
//权限名称
const roleName = roleList.find('.role');
//员工数据表格
const staffDataTable = $('#staffDataTable');
//弹出框延迟时间
const DELAY_TIME = 800;
//标志位
let flag = true;

//部门工具栏对象
const $btnRefresh = $('.btn-refresh'),
	 		$btnPlus = $('.btn-plus'),
		  $btnEdit = $('.btn-edit'),
		  $btnRemove = $('.btn-remove'),
		  $btnCog = $('.btn-cog'),
		  $btnUnlock = $('.btn-unlock'),
		  $btnBan = $('.btn-ban'),
	    $btnReg = $('.btn-reg');

$(function(){
	//页面加载渲染部门树
  renderOrganizeTree();
  //DataTable初始化配置
  staffDataTable.dataTable({
    paging: true,
    searching: true,
    info: true,
    columns: [
      { data: 'index' },
      { data: 'name' },
      { data: 'gender' },
      { data: 'email' },
      { data: 'orgName' },
      { data: 'btn' }
  	]
  });
})
var organizeId;
//组织节点点击事件(显示部门名称，并获取该部门下员工)
function HandlerClick(event, treeId, treeNode){
  organizeId = treeNode.id;
  departmentName.text(treeNode.name);
 	departmentId.val(organizeId);
  //展示该节点启用或禁用状态
  if(treeNode.status){
  	$btnUnlock.addClass('disabled').parent().addClass('disabled');
  	$btnBan.removeClass('disabled').parent().removeClass('disabled');
  }else{
  	$btnBan.addClass('disabled').parent().addClass('disabled');
  	$btnUnlock.removeClass('disabled').parent().removeClass('disabled');
  }
 	//加载该节点下员工列表
 	renderStaffList(organizeId);
}
//判断父节点
function isParent(treeNode){
	return treeNode.isParent;
}
//判断根节点
function isRoot(treeNode){
	return !treeNode.pId;
}
//获取被选中的单个节点
function getSeletedNode(){
	var treeObj = $.fn.zTree.getZTreeObj("organizeTree");
  var node = treeObj.getSelectedNodes()[0];
  if(!node){
  	$.dialog().alert({message: '请选择部门！'})
    return false;
  }
 	return node;
}
//刷新操作    
// $btnRefresh.on('click', function(){
// 	renderOrganizeTree()
// })
//新增部门表单
const newOrgModal = $('#newOrgModal'),
	    newOrgTitle = newOrgModal.find('.modal-title'),
	    newOrgName = $('#newOrgName'),
	    newOrgDesc = $('#newOrgDesc'),
	    newOrgBtn = $('#newOrgBtn');

//编辑部门表单
const editOrgModal = $('#editOrgModal'),
			editOrgTitle = editOrgModal.find('.modal-title'),
	    editOrgName = $('#editOrgName'),
	    editOrgDesc = $('#editOrgDesc'),
	    editOrgBtn = $('#editOrgBtn');

//渲染部门树
function renderOrganizeTree(){
  $.ajax({
    type: 'GET',
    url: '/partner/get_organize_tree?partnerId='+ partnerId,
  })
  .done(function(res){
    const organizes = res.organizes;
    const setting = {
    	view: {
    		selectedMulti: false,
    	},
    	data: {
        simpleData: {
          enable: true
        }
      },
		  callback: {
		    onClick: HandlerClick,
		  }
		}
    var zNode = [];
    var treeObj;
    organizes.forEach(function(organize){
    	var iconSkin;
    	if(!organize.parentId){
    		iconSkin = 'root';
    	}else{
    		iconSkin = 'folder';
    	}
    	treeObj = {
        id: organize.orgId,
        pId: organize.parentId,
        name: organize.name,
        note: organize.note,
        status: organize.status,
        iconSkin: iconSkin,
        open: true,
      };
      zNode.push(treeObj)
    })
    $.fn.zTree.init(organizeTree, setting, zNode);
  })
  .fail(function(error){ 
    console.log(error)
  })
}
//DataTable渲染数据
function renderTableData(dataArr) { 
  const table = staffDataTable.dataTable();
  const oSettings = table.fnSettings(); 
  table.fnClearTable(this); 
  dataArr.forEach(function(data){
  	table.oApi._fnAddData(oSettings, data);
  })
  oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();
  table.fnDraw();
}
//渲染员工列表
function renderStaffList(organizeId){
  $.ajax({
    url: '/partner/get_organize_staff?organizeId='+ organizeId,
  })
  .done(function(res){
    const users = res.users;
	  const dataArr = [];
	  users.forEach(function(user, index){
	  	const gender = user.gender == '1' ? '女' : '男';
	  	const _user = {
  				"index": index + 1, 
		  		"name": user.name, 
		  		"gender": gender, 
		  		"email": user.email, 
		  		"orgName": user.organize.name, 
		  		"btn": '<a href="/partner/staff_manage" class="btn btn-link">管理</a>'
		  	};
	  	dataArr.push(_user)
	  })
	  renderTableData(dataArr)
  })
  .fail(function(error){
    console.log(error)
  })
}
//新增组织节点
$btnPlus.on('click', function(e){
	e.preventDefault();
  if(!getSeletedNode()) return false;
  const node = getSeletedNode();
  newOrgTitle.html('新增<a>'+node.name+'</a>的下属部门');
  $('.btn-reset').click();
  $('.form-group').removeClass('has-success');
})
//新增组织表单提交
newOrgBtn.on('click', function(e){
	e.preventDefault()
	if(!getSeletedNode()) return false;
  const node = getSeletedNode();
	if(!(checkInput(newOrgName) && checkInput(newOrgDesc))) return false;
	const organize = {
		parent_id: node.id,
		name: $.trim(newOrgName.val()),
  	note: $.trim(newOrgDesc.val())
	}
	if(flag){
		flag = false;
		$.ajax({
			type: 'post',
			url: '/partner/new_organize',
			data: {organize: organize},
		})
		.done(function(res) {
			if(res.status == 1){
				$.dialog().success({message: ''+res.message+'', delay: DELAY_TIME})
				setTimeout(function(){
					renderOrganizeTree()
				}, DELAY_TIME)
			}else if(res.status == 2){
				$.dialog().fail({message: ''+res.message+''});
			}
			flag = true;
		})
		.fail(function(err) {
			console.log(err);
		})
	}
})
//编辑组织节点
$btnEdit.on('click', function(e){
	e.preventDefault();
  if(!getSeletedNode()) return false;
 	const node = getSeletedNode();
 	if(isRoot(node)){
 		editOrgTitle.text('编辑公司名称(仅在组织树上生效)');
 		$('.organize-name').text('公司名称');
 		$('.organize-desc').hide();
 	}else{
 		editOrgTitle.text('部门编辑');
	 	$('.organize-name').text('部门名称');
	 	$('.organize-desc').show();
 	}
 	const name = node.name,
 	      note = node.note;
 	editOrgName.val(name);
 	editOrgDesc.val(note);
 	$('.form-group').removeClass('has-success');
})
//编辑组织表单提交
editOrgBtn.on('click', function(e){
	e.preventDefault()
	if(!getSeletedNode()) return false;
 	const node = getSeletedNode();
	if(!checkInput(editOrgName)) return false;
	const organize = {
		id: node.id,
		name: $.trim(editOrgName.val()),
  	note: $.trim(editOrgDesc.val())
	}
	if(flag){
		$.ajax({
			type: 'post',
			url: '/partner/edit_organize',
			data: {organize: organize},
		})
		.done(function(res) {
			if(res.status == 1){
				$.dialog().success({message: '编辑成功', delay: DELAY_TIME})
				setTimeout(function(){
					renderOrganizeTree()
				}, DELAY_TIME)
			}else if(res.status == 2){
				$.dialog().fail({message: '编辑失败，请稍后重试'})
			}
			flag = true;
		})
		.fail(function(err) {
			console.log(err);
		})
	}
})
//删除组织按钮判断
$btnRemove.on('click', function(e){
	e.preventDefault();
	if(!getSeletedNode()) return false;
	const node = getSeletedNode();
	const orgId = node.id,
	      name = node.name;
	if(isRoot(node)){
		$.dialog().alert({message:'企业节点不可删除！'});
		return false;
	}
	if(isParent(node)){
		$.dialog().fail({message:'该部门有下属部门，不可删除！'});
		return false;
	}
	$.dialog().confirm({message:'确定删除<a>'+name+'</a>？此操作不可恢复'})
	.on('confirm', function(){
		removeOrganize(orgId)
	})
})
//删除组织节点
function removeOrganize(orgId){
	$.ajax({
		type: 'GET',
		url: '/partner/remove_organize?id=' + orgId,
	})
	.done(function(res){
		if(res.status == 1){
			$.dialog().success({message: '删除成功', delay: DELAY_TIME})
			setTimeout(function(){
				renderOrganizeTree()
			}, DELAY_TIME)
		}else if(res.status == 2){
			$.dialog().fail({message: '该部门有下属部门，不可删除'})
		}else if(res.status == 3){
			$.dialog().fail({message: '该部门有员工，不可删除'})
		}else if(res.status == 0){
			$.dialog().fail({message: '企业节点禁止删除'})
		}else{
			$.dialog().fail({message: '删除失败，请稍后重试'})
		}
	})
	.fail(function(error){
		console.log(error)
	})
}
//设置权限操作
$btnCog.on('click', function(e){
	e.preventDefault()
	if(!getSeletedNode()) return false;
 	const node = getSeletedNode();
  const orgId = node.id;
  roleItem.map(function(index, item){
  	$(item).removeClass('checked')
  })
  getRoleByOrgId(orgId)
})
//权限列表回显
function getRoleByOrgId(orgId){
	$.ajax({
		url: '/partner/get_org_role?id='+ orgId,
	})
	.done(function(res) {
		const orgRoles = res.orgRoles;
		const getRoleId = orgRole => orgRole.role;
		const roleIdList = orgRoles.map(getRoleId);
		for(let i = 0; i < roleItem.length; i++){
			for(let j = 0; j < roleIdList.length; j++){
				if($(roleItem[i]).data('role') == roleIdList[j]){
					$(roleItem[i]).addClass('checked')
					break;
				}
			}
		}
	})
	.fail(function(error) {
		console.log(error);
	})
}
//点击权限查看对应功能
roleName.on('click', function(e){
	e.stopPropagation();
	getFuncByRole($(this).parent().data('role'))
})

//获取权限对应的功能点
function getFuncByRole(roleId){
  $.ajax({
  	url: '/system/get_role_func?id='+ roleId,
  })
  .done(function(res) {
  	const funcs = res.funcs;
		const setting = {
    	view: {
    		selectedMulti: false,
    	},
    	data: {
        simpleData: {
          enable: true 
        }
      },
		}
    const zNode = [];
    var treeObj;
    funcs.forEach(function(func){
    	var iconSkin;
      if(!func.parentId){
        iconSkin = 'root'
      }else if(func.funcType == 0){
    		iconSkin = 'folder'
    	}
      treeObj = {
        id: func.funcId,
        pId: func.parentId,
        name: func.name,
        open: true,
        iconSkin: iconSkin,
      };
      zNode.push(treeObj)
    })
    $.fn.zTree.init(roleFunctionTree, setting, zNode);
  })
  .fail(function() {
  	console.log("error");
  })
}
//选择权限
roleItem.on('click', function(){
	if($(this).hasClass('checked')){
		$(this).removeClass('checked')
	}else{
		$(this).addClass('checked')
	}
})
// 设置权限
$('#setRoleBtn').on('click', function(e){
	e.preventDefault();
	if(!getSeletedNode()) return false;
 	const node = getSeletedNode();
  const orgId = node.id;
	const checkedList = roleList.children('.checked');
	const roleIdList= [];
	checkedList.each(function(index, roleItem){
		roleIdList.push($(roleItem).data('role'))
	})
	const org_role = {
		org_id: orgId,
		role_list: roleIdList
	}
	if(flag){
		flag = false;
		$.ajax({
			url: '/partner/set_org_role',
			type: 'POST',
			data: {org_role: org_role},
		})
		.done(function(res) {
			if(res.status == 1){
				$.dialog().success({message: '设置成功', delay: DELAY_TIME})
			}else{
				$.dialog().fail({message: '设置失败, 请稍后重试'})
			}
			flag = true;
		})
		.fail(function(error) {
			console.log(error);
		})
	}
})
//部门启用
$btnUnlock.on('click', function(e){
	e.preventDefault();
	if(!getSeletedNode()) return false;
 	const node = getSeletedNode();
  $.dialog().confirm({message: '确定将<a>'+node.name+'</a>设置为启用状态?'})
	 .on('confirm', function(){
		 setOrgStatus(node.id, true)
	})
})
//部门禁用
$btnBan.on('click', function(e){
	e.preventDefault();
	if(!getSeletedNode()) return false;
 	const node = getSeletedNode();
  $.dialog().confirm({message: '确定将<a>'+node.name+'</a>设置为禁用状态?'})
	 .on('confirm', function(){
		setOrgStatus(node.id, false)
	})
})
//设置部门状态
function setOrgStatus(orgId, status){
	status = status ? 1 : 0;
	$.ajax({
		url: '/partner/set_org_status?id='+ orgId+'&&status='+ status,
	})
	.done(function(res) {
		if(res.status == 1){
			$.dialog().success({message: '设置成功', delay: DELAY_TIME})
			if(status){
				setTimeout(function(){
					$btnUnlock.addClass('disabled').parent().addClass('disabled');
					$btnBan.removeClass('disabled').parent().removeClass('disabled');
				}, DELAY_TIME)
			}else{
				setTimeout(function(){
					$btnBan.addClass('disabled').parent().addClass('disabled');
					$btnUnlock.removeClass('disabled').parent().removeClass('disabled');
				}, DELAY_TIME)
			}
		}else{
			$.dialog().fail({message: '设置失败，请稍后重试'})
		}
	})
	.fail(function(error) {
		console.log(error);
	})
}
//员工代注册表单
const agentRegModal = $('#agentRegModal'),
      regModalTitle = agentRegModal.find('.modal-title'),
      formGroup = agentRegModal.find('.form-group'),
      resetBtn = agentRegModal.find('.btn-reset'),
      userOrg = $('#userOrg'),
      userName = $('#userName'),
      userEmail = $('#userEmail'),
      userPasswd = $('#userPasswd'),
      confirmPasswd = $('#confirmPasswd'),
      agentRegBtn = $('#agentRegBtn');
//正则表达式   
const regular = {
			name: /^[\u4E00-\u9FA5A-Za-z]+$/,
		  email: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
		  password: /^.{8,20}$/,
}
//错误信息提示			
const msg = {
	name: {
		required: '请输入姓名',
		regular: '姓名只能是中文或英文'
	},
	email: {
		required: '请输入邮箱',
		regular: '邮箱格式不正确',
		existed: '该邮箱号已被占用'
	},
	password: {
    required: '请输入密码',
    regular: '密码长度为8-20位',
  },
  confirmPasswd: {
  	required: '请再次输入密码',
  	inconsistent: '两次密码输入不一致'
  }
}
$btnReg.on('click', function(e){
	e.preventDefault()
	if(!getSeletedNode()) return false;
	const node = getSeletedNode();
 	regModalTitle.html('注册员工（'+node.name+'）');
 	userOrg.val(node.id);
})
agentRegBtn.on('click', function(e){
  e.preventDefault();
  let status = $(this).attr('data-status');
  if(status == 0) return false;
  if(validateForm(userName, msg.name, regular.name) &&
    validateForm(userEmail, msg.email, regular.email) &&
    validateForm(userPasswd, msg.password, regular.password) &&
    checkConsistency(confirmPasswd, userPasswd, msg.confirmPasswd)){
  	agentRegistered()
  }else{
  	return false;
  }
})
onBlurValidate(userName, msg.name, regular.name, validateForm)
onBlurValidate(userPasswd, msg.password, regular.password, validateForm)
onBlurValidate(confirmPasswd, msg.confirmPasswd, regular.confirmPasswd, checkConsistency, userPasswd)
let _tempEmail;
userEmail.blur(function(){
	const value = $.trim($(this).val());
	if(value == ''){
		clearTip($(this));
		return;
	}
	if(_tempEmail == value) return;
	_tempEmail = value;
	validateForm(userEmail, msg.email, regular.email) &&
	queryEmail(userEmail, msg.email, agentRegBtn, 'null')
})
function agentRegistered(){
	const userObj = {
		organize: $.trim(userOrg.val()),
		name: $.trim(userName.val()),
		email: $.trim(userEmail.val()),
		password: $.trim(userPasswd.val()),
	}
	$.ajax({
		url: '/user/signup',
		type: 'POST',
		data: {user: userObj},
	})
	.done(function(res) {
		if(res.status == 1){
			$.dialog().success({message: '注册成功', delay: DELAY_TIME})
			formGroup.removeClass('has-success');
			resetBtn.click();
			setTimeout(function(){
				renderStaffList(organizeId);
			}, DELAY_TIME)
		}else{
			$.dialog().fail({message: '注册失败，请稍后重试'})
		}
	})
	.fail(function(error) {
		console.log(error);
	})
}