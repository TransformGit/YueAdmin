const Partner = require('../models/partner');
const User = require('../models/user');
const Organize = require('../models/organize');
const Role = require('../models/role');
const OrgRole = require('../models/org_role');
const RoleFunc = require('../models/role_func');
const PartnerType = require('../models/partner_type');
const PartTypeRole = require('../models/partType_role');
const Title = require('../models/title');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

//去除前后空格
function Trim(str){ 
  return str.replace(/(^\s*)|(\s*$)/g, ''); 
}
//获取数组a与数组b不重复的部分
function complement(a, b){
	var temp = [];
	var arr = [];
	for(var i = 0; i < b.length; i++){
		temp[b[i]] = true;
	}
 for(var j = 0; j < a.length; j++){
 	if(!temp[a[j]]){
 		arr.push(a[j])
 	}
 }
 return arr;
} 
//企业LOGO上传
exports.logoUpload = function(req, res, next){
	var logoData = req.files.logo;
	console.log(logoData)
	if(logoData && logoData.originalFilename){
		var logoPath = logoData.path;
		fs.readFile(logoPath, function(err, data){
			var timestamp = Date.now();
			var type = logoData.name.split('.')[1];
			var logo = 'logo_' + timestamp + '.' + type;
			var newPath = path.join(__dirname, '../', 'public/upload/logo/' + logo);
			fs.writeFile(newPath, data, function(err){
				req.logo = logo;
				next()
			})
		})
	}else{
		next()
	}
}
//营业执照上传
exports.licenseUpload = function(req, res, next){
	var licenseData = req.files.license;
	console.log(licenseData)
	if(licenseData && licenseData.originalFilename){
		var licensePath = licenseData.path;
		fs.readFile(licensePath, function(err, data){
			var timestamp = Date.now();
			var type = licenseData.name.split('.')[1];
			var license = 'license_' + timestamp + '.' + type;
			var newPath = path.join(__dirname, '../', 'public/upload/license/' + license);
			fs.writeFile(newPath, data, function(err){
				req.license = license;
				next()
			})
		})
	}else{
		next()
	}
}
//检测用户是否可注册
exports.isPartnerRegisterd = function(req, res, next){
	const user = req.session.user;
	if(!user.partner){
		return next()
	}
	const partnerId = user.partner;
	var _partner = {};
	User.findOne({partner: partnerId})
			.populate('partner', 'is_verified name')
			.exec(function(err, user){
				if(user.partner.is_verified == 0 || user.partner.is_verified == 3){
					_partner.msg = '您的企业注册信息已提交！';
					return res.render('account/registered_partner_submit', {title: '等待审核', partner: _partner})
				}else if(user.partner.is_verified == 2){
					Partner.findById(user.partner, function(err, partner){
						_partner.info = partner.reject_info;
						return res.render('account/registered_partner_result', {title: '未通过审核', partner: _partner})
					})
				}else if(user.partner.is_verified == 1){
					Partner.findById(user.partner, function(err, partner){
						return res.render('partner/partner_info', {title: '企业信息', partner: partner})
					})
				}
			})
}
//检测用户是否注册企业通过审核
exports.isPartnerPass = function(req, res, next){
	const user = req.session.user;
	if(!user.partner){
		return res.redirect('/account/registered_partner')
	}
	const partnerId = user.partner;
	var _partner = {};
	User.findOne({partner: partnerId})
			.populate('partner', 'is_verified name')
			.exec(function(err, user){
				if(user.partner.is_verified == 1){
					Partner.findById(user.partner, function(err, partner){
						return next()
					})
				}else if(user.partner.is_verified == 0 || user.partner.is_verified == 3){
					_partner.msg = '您的企业注册信息已提交！';
					return res.render('account/registered_partner_submit', {title: '等待审核', partner: _partner})
				}else if(user.partner.is_verified == 2){
					Partner.findById(user.partner, function(err, partner){
						_partner.info = partner.reject_info;
						return res.render('account/registered_partner_result', {title: '未通过审核', partner: _partner})
					})
				}
			})
}

//企业注册信息保存
exports.saveInfo = function(req, res){
	const user = req.session.user;
	const uid = user._id;
	const partnerObj = req.body.partner;
	const id = partnerObj.id;
	if(req.logo){
		partnerObj.logo = req.logo;
	}
	if(req.license){
		partnerObj.license = req.license;
	}
	var _partner;
	if(id){
		Partner.findById(id, function(err, partner){
			if(err) console.log(err);
			_partner = _.extend(partner, partnerObj);
			_partner.is_verified = 3;
			_partner.save(function(err, partner){
				if(err) console.log(err);
				console.log('提交注册成功again')
				_partner.msg = '修改提交成功',
				res.render('account/registered_partner_submit',{
					title: '修改提交成功',
					partner: _partner
				})
			})
		})
	}else{
		partnerObj.admin = uid;
		Partner.findOne({admin: uid}, function(err, partner){
			if(err) console.log(err);
			if(!partner){
				_partner = new Partner(partnerObj);
				console.log(_partner)
				_partner.save(function(err, partner){
					console.log('提交注册成功')
					console.log(partner)
					User.update({_id: uid},{$set: {partner: partner._id}}, function(err, msg){
						user.partner = partner._id; 
						res.render('account/registered_partner_submit',{title: '提交注册成功'})
					})
				})
			}else{
				console.log('该账号已经注册，不能重复注册！')
				res.redirect('/partner/partner_info')
			}
		})
	}
}
//注册企业返回重写
exports.showRegistered = function(req, res){
	var user = req.session.user;
	if(!user.partner){
		return res.redirect('/account/registered_partner');
	}
	Partner.findOne({admin: user._id})
				 .exec(function(err, partner){
					return res.render('account/registered_partner_rewrite', {
						title: '注册我的企业', 
						partner: partner
				  })
			  })
}
//企业注册信息重写保存
exports.saveRewriteInfo = function(req, res){
	const partnerObj = req.body.partner;
	console.log(partnerObj)
  const id = partnerObj.id;
	if(id){
		Partner.findById(id, function(err, partner){
			if(err) console.log(err);
			_partner = _.extend(partner, partnerObj);
			_partner.is_verified = 3;
			_partner.save(function(err, partner){
				if(err) console.log(err);
				console.log('提交注册成功again')
				_partner.msg = '修改提交成功',
				res.render('account/registered_partner_submit',{
					title: '修改提交成功',
					partner: _partner
				})
			})
		})
	}else{
		res.redirect('/account/registered_partner')
	}
}
//企业信息展示
exports.showInfo = function(req, res){
	var user = req.session.user;
	if(user.partner){
		Partner.find({admin: user._id})
				 .populate('user', 'name')
				 .exec(function(err, partner){
				 		if(partner[0].is_verified !== 1){
				 			res.redirect('/account/registered_partner')
				 		}else{
				 			res.render('partner/partner_info',{title: '企业信息', partner: partner[0]})
				 		}
				 })
	}else{
		res.redirect('/account/registered_partner')
	}
}

//企业信息编辑页
exports.showInfoEdit = function(req, res){
	var user = req.session.user;
	if(user.partner){
		Partner.findOne({admin: user._id})
					 .populate('user', 'name')
					 .exec(function(err, partner){
					 		res.render('partner/partner_info_edit', {
					 			title: '企业信息编辑', 
					 			partner: partner
					 		})
					 })
	}
}
//企业信息编辑
exports.EditInfo = function(req, res){
	var _partner = req.body.partner;
	var id = _partner.id;
	Partner.findOne({_id: id}, function(err, partner){
		_partner.logo = req.logo || partner.logo;
		_partner.license = req.license || partner.license;
		Partner.update({_id: id}, {$set: _partner }, function(err, msg){
			if(err) console.log(err);
			res.redirect('/partner/partner_info')
		})
	})
}
//组织管理
exports.organizeManage = function(req, res){
	const user = req.session.user;
	const partnerId = user.partner;
	const roles = [];
	User.findOne({partner: partnerId})
			.populate('partner', 'is_verified _id name')
			.exec(function(err, user){
				if(!user){
					return res.render('account/registered_partner', {title: '注册我的企业'})
				}
				if(user.partner.is_verified == 0 || user.partner.is_verified == 3){
					res.render('account/registered_partner_submit',{title: '等待审核'})
				}else if(user.partner.is_verified == 2){
					res.render('account/registered_partner_result',{title: '未通过审核', partner: partner})
				}else{
					if(err) console.log(err);
					Partner.findById(partnerId, function(err, partner){
						PartTypeRole.find({partType: partner.partner_type})
												.populate('role', 'name')
												.exec(function(err, typeRoles){
													var roleObj;
													typeRoles.forEach(function(typeRole){
														roleObj = {
															_id: typeRole.role._id,
															name: typeRole.role.name,
														}
														roles.push(roleObj)
													})
													res.render('partner/organize_manage', {
														title: '部门管理', 
														user: user, 
														roles: roles,
													})
												})
					})
				}
			})
}
//获取组织树
exports.getOrganizeTree = function(req, res){
	const partnerId = req.query.partnerId;
	var organizeId;
	if(req.query.organizeId){
		organizeId = req.query.organizeId;
	}
	var _organizes = [];
	var _organize;
	Organize.find({partner: partnerId}).exec(function(err, organizes){
		if(organizeId){
			User.find({partner: partnerId, organize: organizeId})
					.populate('organize', 'name')
					.exec(function(err, users){
						if(err) console.log(err)
						res.json({organizes: organizes, users: users})
					})
		}else{
			User.find({partner: partnerId})
					.populate('organize', 'name')
					.exec(function(err, users){
						if(err) console.log(err)
							organizes.forEach(function(org){
								_organize = {
									orgId: org._id,
									name: org.name,
									parentId: org.parent_id,
									note: org.note,
									status: org.status,
								}
								_organizes.push(_organize);
							})
						res.json({organizes: _organizes, users: users})
					})
		}
	})
}
//获取企业员工
exports.getPartnerStaff = function(req, res){
	var partnerId = req.query.partnerId;
	User.find({partner: partnerId})
			.populate('organize', 'name')
			.exec(function(err, users){
				if(err) console.log(err)
				return res.json({users: users})
			})
}
//获取部门员工
exports.getOrganizeStaff = function(req, res){
	var organizeId = req.query.organizeId;
	User.find({organize: organizeId})
			.populate('organize', 'name')
			.exec(function(err, users){
				if(err) console.log(err)
				return res.json({users: users})
			})
}
//创建组织节点
exports.newOrganize = function(req, res){
	const user = req.session.user;
	const _organize = req.body.organize;
	const uid = user._id;
	_organize.admin = uid;
	_organize.creator = uid;
	_organize.partner = user.partner._id;
	console.log(_organize)
	var organize = new Organize(_organize);
	organize.save(function(err, organize){
		if(err){
			console.log(err);
			res.json({status: 0, message: '添加失败'})
		}else{
			res.json({status: 1, message: '添加成功'})
		}
	})
}
//编辑组织节点
exports.editOrganize = function(req, res){
	const user = req.session.user;
	const _organize = req.body.organize;
	const id = _organize.id;
	if(id){
		Organize.update({_id: id}, {$set: _organize }, function(err, msg){
			if(err) {
				console.log(err)
				res.json({status: 2})
			}else{
				res.json({status: 1})
			}
		})
	}
}
//删除组织
exports.removeOrganize = function(req, res){
	var id = req.query.id;
	if(id == '') return res.json({status: -1})
	Organize.findById(id, function(err, organize){
		if(organize.is_partner_root == 1){
			return res.json({status: 0})
		}else{
			Organize.find({parent_id: id}).exec(function(err, organizes){
				if(err) console.log(err);
				if(organizes[0]){
					res.json({status: 2})
				}else{
					User.find({organize: id}).exec(function(err, users){
						if(err) console.log(err);
						if(users[0]){
							res.json({status: 3})
						}else{
							Organize.remove({_id: id}, function(err, msg){
								if(err) console.log(err)
								res.json({status: 1})
							})
						}
					})
				}
		})
		}
	})
}
/** 权限设置 **/

//设置权限
exports.setOrgRole = function(req, res){
	var user = req.session.user;
	var uid = user._id;
	var orgRole = req.body.org_role;
	var orgId = orgRole.org_id;
	var roleList = orgRole.role_list;
	var orgRoleObj = {
		creator: uid,
		organize: orgId,
	}
	var _orgRole;
	var orgRoleList = [];
	OrgRole.find({organize: orgId}, function(err, orgRoles){
		if(err) console.log(err);
		console.log('orgRoles')
		console.log(orgRoles)
		orgRoles.forEach(function(orgRole){
			orgRoleList.push(orgRole.role)
		})
		//被移除的角色列表
		const removeRoleList = complement(orgRoleList, roleList);
		if(removeRoleList.length !== 0){
			removeRoleList.forEach(function(role){
				OrgRole.remove({organize: orgId, role: role}, function(err, msg){
					if(err){
						console.log(err);
						return res.json({status: 0})
					}
				})
			})
		}
		//新增的角色列表
		const newRoleList = complement(roleList, orgRoleList);
		if(newRoleList.length !== 0){
			newRoleList.forEach(function(role){
				orgRoleObj.role = role;
				console.log(orgRoleObj)
				_orgRole = new OrgRole(orgRoleObj);
				_orgRole.save(function(err, orgRole){
					if(err){
						console.log(err);
						return res.json({status: 0})
					}
					res.json({status: 1})
				})
			})
		}
	})
}
//根据部门Id获取角色列表
exports.getRolesByOrgId = function(req, res){
	var orgId = req.query.id;
	OrgRole.find({organize: orgId})
				 .exec(function(err, orgRoles){
					  if(err) console.log(err)
					 	res.json({orgRoles: orgRoles})
				 })
}
//根据部门Id获取所有功能点
exports.getFuncsByOrgId = function(req, res){
	var orgId = req.query.id;
	OrgRole.find({organize: orgId})
				 .exec(function(err, orgRoles){
					  if(err) console.log(err)
					  if(orgRoles[0]){
					  	var roleId = orgRoles[0].role;
							RoleFunc.find({role: roleId, status: 1})
											.populate('func', 'name parent_id')
											.exec(function(err, role_funcs){
												if(err){
													console.log(err)
												}
												res.json({role_funcs: role_funcs})
											})
										}else{
											res.json({status: 0})
										}
				 })
}
//设置部门状态
exports.setOrgStatus = function(req, res){
	var id = req.query.id;
	var status = req.query.status;
	console.log(id)
	console.log(status)
	if(id){
		Organize.findById(id, function(err, organize){
			if(err) console.log(err)
			organize.update({$set: {status: status}}, function(err, msg){
				if(err) console.log(err)
					res.json({status: 1})
			})
		})
	}else{
		res.json({status: 0})
	}
}

//员工管理
exports.staffManage = function(req, res){
	const _user = req.session.user;
	const partnerId = _user.partner._id;
	User.find({partner: partnerId})
			.populate('partner', 'name')
			.populate('organize', 'name')
			.populate('title', 'name')
			.exec(function(err, users){
			  if(err) console.log(err)
			  	Title.find({partner: partnerId})
			  			 .exec(function(err, titles){
			  			 		res.render('partner/staff_manage',{
			  			 			title: '员工管理', 
			  			 			staffList: users,
			  			 			partner_id: partnerId,
			  			 			titles: titles
			  			 		})
			  			 })
			})
}
//员工查询
exports.staffSearch = function(req, res){
	var user = req.body.user;
	console.log(user)
}
//员工详情
exports.showStaffInfo = function(req, res){
	var id = req.query.id;
	User.findById(id, function(err, user){
		if(err) console.log(err)
			res.render('partner/staff_info', {title: '员工信息', user: user})
	})
}
//设置员工部门
exports.setStaffOrganize = function(req, res){
	var sid = req.query.sid;
	var oid = req.query.oid;
	if(sid && oid){
		User.update({_id: sid}, {$set: {organize: oid}}, function(err, msg){
			if(err) console.log(err)
			res.json({status: 1})
		})
	}else{
		res.json({status: 0})
	}
}
//获取员工岗位
exports.getStaffTitle = function(req, res){
	var sid = req.query.sid;
	if(sid){
		User.findById(sid, function(err, user){
			if(err) console.log(err)
				console.log(user)
			res.json({status: 1, title: user.title})
		})
	}else{
		res.json({status: 0})
	}
}
//设置员工岗位
exports.setStaffTitle = function(req, res){
	var tid = req.query.tid;
	var sid = req.query.sid;
	console.log(tid, sid)
	if(sid && tid){
		User.update({_id: sid}, {$set: {title: tid}}, function(err, msg){
			if(err) console.log(err)
			res.json({status: 1})
		})
	}else{
		res.json({status: 0})
	}
}
//设置员工状态
exports.setStaffStatus = function(req, res){
	const uid = req.query.uid;
	const statu = parseInt(req.query.status) ? 0 : 1;
	console.log(uid, statu)
	User.findById(uid, function(err, user){
		console.log(user.name)
		if(err) {
			console.log(err);
			return res.json({status: 0})
		}else{
			if(user.status == statu){
				console.log('已经设置过')
				return res.json({status: 0})
			}else{
				user.update({$set: {status: statu}}, function(err, msg){
					if(err) console.log(err)
					  res.json({status: 1})
				})
			}
		}
	})
	// if(uid){
	// 	User.update({_id: uid}, {$set: {status: status}}, function(err, msg){
	// 		if(err) console.log(err)

	// 		res.json({status: 1})
	// 	})
	// }else{
	// 	res.json({status: 0})
	// }
}

//账户代注册
exports.agentRegister = function(req, res){
	var orgId = req.query.orgId;
	console.log(orgId)
	Organize.findById(orgId, function(err, organize){
		res.render('partner/agent_register', {title: '账户代注册', organize: organize})
	})
}

//岗位管理页
exports.showTitleManage = function(req, res){
	var user = req.session.user;
	var partnerId = user.partner;
	Title.find({partner: partnerId})
			 .populate('creator', 'name')
			 .exec(function(err, titles){
			 	if(err) console.log(err);
				res.render('partner/title_manage', {title: '岗位管理', titles: titles})
			 })
}
//新增岗位
exports.newTitle = function(req, res){
	var user = req.session.user;
	var titleObj = req.body.title;
	titleObj.creator = user._id;
	titleObj.partner = user.partner;
	var _title = new Title(titleObj);
	_title.save(function(err, title){
		if(err) console.log(err)
			res.redirect('/partner/title_manage')
	})
}
//岗位编辑
exports.editTitle = function(req, res){
	var titleObj = req.body.title;
	var tId = titleObj._id;
	console.log(titleObj)
	var _title;
	Title.findById(tId, function(err, title){
		_title = _.extend(title, titleObj);
		_title.save(function(err, title){
			if(err) console.log(err)
				res.redirect('/partner/title_manage')
		})
	})
}
//岗位删除
exports.removeTitle = function(req, res){
	var id = req.query.id;
	throw new Error('xxxx');
	if(id){
		Title.remove({_id: id}, function(err, msg){
			if(err) {
				console.log(err)
				res.json({status: 0})
			}else{
				res.json({status: 1})
			}
		})
	}
}