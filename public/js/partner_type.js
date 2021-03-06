/* 商家类型管理 */

//商家类型数据表格
const partnerTypeDataTable = $('#partnerTypeDataTable');
//角色功能树
const roleFunctionTree = $('#roleFunctionTree');
const DELAY_TIME = 600;
//权限列表对象
const roleList = $('#roleList');
//每项权限
const roleItem = roleList.children('li').not('.active');
//权限名称
const roleName = roleItem.children('.role');
//渲染数据表格
$(function(){
	partnerTypeDataTable.length === 1 && partnerTypeDataTable.dataTable();
})
//商家类型表单
const partTypeForm = $('#partTypeForm'),
			modalTitle = $('#partTypeModal').find('.modal-title'),
	    partTypeName = $('#partTypeName'),
	    partTypeNote = $('#partTypeNote'),
	    partTypeBtn = $('#partTypeBtn');
var partner_type = {};
var partTypeId;
var msg;
function getRowData(target){
	const $tr = $(target).parents('tr');
	const partType = {
		id: $tr.data('type'),
		name: $tr.find('.name').text(),
		note: $tr.find('.note').text(),
	}
	return partType;
}
//新增类型
$('#newPartType').on('click', function(e){
	e.preventDefault();
	modalTitle.html('新增商家类型');
	$('.btn-reset').click();
	partTypeId = '';
	msg = '新增';
})

//商家类型编辑
$('.btn-edit').on('click', function(e){
	const $tr = $(this).parents('tr');
	partTypeId = $tr.data('type');
	modalTitle.html('商家类型编辑')
	partTypeName.val($tr.find('.name').text());
	partTypeNote.val($tr.find('.note').text());
	msg = '编辑';
})
//类型保存
partTypeBtn.on('click', function(e){
	e.preventDefault();
	if(!(simpleCheckInput(partTypeName) && simpleCheckInput(partTypeNote))) return false;
	partner_type = {
		id: partTypeId,
		name: $.trim(partTypeName.val()),
		note: $.trim(partTypeNote.val()),
	}
	savePartType(partner_type, msg)
})
//商家类型保存
function savePartType(partner_type, msg){
	$.ajax({
		url: '/system/save_partner_type',
		type: 'POST',
		data: {partner_type: partner_type},
	})
	.done(function(res) {
		if(res.status == 1){
			$.dialog().success({message: ''+msg+'成功', delay: DELAY_TIME})
			setTimeout(function(){
				location.replace(location.href)
			}, DELAY_TIME)
		}else{
			$.dialog().fail({message: ''+msg+'失败，请稍后重试'})
		}
	})
	.fail(function() {
		console.log("error");
	})
}
//权限回显
const setRoleTitle = $('#setTypeRoleModal').find('.modal-title');
$('.btn-set').on('click', function(e){
	const partType = getRowData($(this));
	partTypeId = partType.id;
	setRoleTitle.html('权限设置<a>('+partType.name+')</a>')
	roleItem.removeClass('checked')
	getRoleByPartType(partTypeId)
})
//选择权限
roleItem.on('click', function(e){
	const _this = $(this);
	_this.hasClass('checked') ? _this.removeClass('checked') : _this.addClass('checked')
})
//点击权限查看对应功能
roleName.on('click', function(e){
	e.stopPropagation();
	let roleId = $(this).parent().data('role');
	getFuncByRole(roleId)
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
    var zNode = [];
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
$('#setPartRoleBtn').on('click', function(e){
	e.preventDefault();
	const checkedList = roleList.children('.checked');
	const roleIdList= [];
	checkedList.each(function(index, roleItem){
		roleIdList.push($(roleItem).data('role'))
	})
	const typeRole = {
		partType: partTypeId,
		roleList: roleIdList
	}
	console.log(typeRole)
	$.ajax({
		url: '/system/set_partType_role',
		type: 'POST',
		data: {typeRole: typeRole},
	})
	.done(function(res) {
		if(res.status == 1){
			$.dialog().success({message: '设置成功', delay: DELAY_TIME})
		}else{
			$.dialog().fail({message: '设置失败，请稍后重试'})
		}
	})
	.fail(function() {
		console.log("error");
	})
})
//获取商家类型拥有的权限
function getRoleByPartType(typeId){
	$.ajax({
		url: '/system/get_role_by_partType',
		type: 'POST',
		data: {id: typeId},
	})
	.done(function(res) {
		const roleArr = res.roles;
		for(let i = 0; i < roleItem.length; i++){
			for(let j = 0; j < roleArr.length; j++){
				if($(roleItem[i]).data('role') == roleArr[j].id){
					$(roleItem[i]).addClass('checked')
					break;
				}
			}
		}
	})
	.fail(function() {
		console.log("error");
	})
}
//状态设置
$('.btn-status').on('click', function(e){
	const _this = $(this);
	const status = parseInt(_this.attr('data-status'));
	const $tr = $(this).parents('tr');
	const typeId = $tr.data('type');
	const name = $tr.find('.name').text();
	const info = status ? '禁用状态' : '启用状态';
	$.dialog().confirm({message: '确定将<a>'+name+'</a>设为'+ info})
	 .on('confirm', function(){
	 	setPartTypeStatus(typeId, status, _this)
	 })
})
function setPartTypeStatus(typeId, status, statusBtn){
	$.ajax({
		url: '/system/set_partner_type_status',
		type: 'POST',
		data: {id: typeId, statu: status},
	})
	.done(function(res) {
		if(res.status == 1){
			$.dialog().success({message: '设置成功', delay: DELAY_TIME})
			setTimeout(function(){
				if(status == 1){
					statusBtn.attr('data-status', 0).attr('title','禁用状态')
									 .find('.fa').removeClass('fa-toggle-on').addClass('fa-toggle-off');
				}else{
					statusBtn.attr('data-status', 1).attr('title','启用状态')
								   .find('.fa').removeClass('fa-toggle-off').addClass('fa-toggle-on');
				}
			}, DELAY_TIME)
		}else{
			$.dialog().fail({message: '设置失败，请稍后重试'})
		}
	})
	.fail(function() {
		console.log("error");
	})
}