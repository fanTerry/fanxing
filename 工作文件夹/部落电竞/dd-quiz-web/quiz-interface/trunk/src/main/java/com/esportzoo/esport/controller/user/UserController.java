package com.esportzoo.esport.controller.user;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.collection.CollectionUtil;
import cn.hutool.core.util.StrUtil;
import com.esportzoo.common.appmodel.domain.result.ModelResult;
import com.esportzoo.common.util.CookieUtils;
import com.esportzoo.esport.client.service.consumer.UserConsumerServiceClient;
import com.esportzoo.esport.client.service.expert.RecExpertApplyServiceClient;
import com.esportzoo.esport.client.service.expert.RecExpertServiceClient;
import com.esportzoo.esport.connect.request.BasePageRequest;
import com.esportzoo.esport.connect.request.UserInfoRequest;
import com.esportzoo.esport.connect.request.sms.SendALiYunSmsParam;
import com.esportzoo.esport.connect.request.user.FollowedUserRequest;
import com.esportzoo.esport.connect.response.CommonResponse;
import com.esportzoo.esport.constant.ResponseConstant;
import com.esportzoo.esport.constants.UserOperationParam;
import com.esportzoo.esport.constants.cms.FollowStatus;
import com.esportzoo.esport.constants.sms.SendSmsEnum;
import com.esportzoo.esport.constants.user.FollowedUserType;
import com.esportzoo.esport.constants.user.MemberConstants;
import com.esportzoo.esport.controller.BaseController;
import com.esportzoo.esport.domain.RecExpert;
import com.esportzoo.esport.domain.UserCenterInfoVo;
import com.esportzoo.esport.domain.UserConsumer;
import com.esportzoo.esport.manager.RedisClientManager;
import com.esportzoo.esport.manager.sms.SmsManager;
import com.esportzoo.esport.util.RegisterValidUtil;
import com.esportzoo.esport.vo.MemberSession;
import com.esportzoo.esport.vo.cms.FollowUserParam;
import com.esportzoo.esport.vo.cms.FollowedUserPageQueryParam;
import com.esportzoo.esport.vo.cms.FollowedUserPageQueryResult;
import com.esportzoo.esport.vo.cms.FollowedUserVo;
import com.google.common.collect.Lists;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Controller
@RequestMapping("user")
@Api(value = "用户相关接口", tags={"用户相关接口"})
public class UserController extends BaseController {
	
	@Autowired
	private UserConsumerServiceClient userConsumerServiceClient;
	@Autowired
	private RecExpertServiceClient recExpertServiceClient;
	@Autowired
	RecExpertApplyServiceClient recExpertApplyServiceClient;
	@Autowired
	private RedisClientManager redisClientManager;
	@Autowired
	private SmsManager smsManager;
	@Value("${avatarImage.upload.path}")
	private String uploadPath;

	@Value("${avatarImage.res.host}")
	private String resPath;

	public static final String logPrefix = "用户相关接口-";


	@RequestMapping(value="/follow", produces = "application/json; charset=utf-8", method = RequestMethod.POST)
	@ApiOperation(value = "关注或取消关注接口", httpMethod = "POST", consumes = "application/x-www-form-urlencoded", produces = "application/json")
	@ApiResponse(code = 200, message = "关注或取消关注接口", response = CommonResponse.class)
	@ResponseBody
	public CommonResponse<Boolean> followOrCancel(@ApiParam(required=true, value="1=关注 0=取消关注")int type, @ApiParam(required=true, value="用户id")Long usrId, HttpServletRequest request) {
		try {
			UserConsumer userConsumer = getLoginUsr(request);
			if (userConsumer == null) {
				logger.info("关注或取消关注接口,未获取到登录用户信息，type={}，usrId={}", type, usrId);
				return CommonResponse.withErrorResp("未获取到登录用户信息");
			}
			FollowUserParam param = new FollowUserParam();
			param.setUserId(userConsumer.getId());
			param.setType(type);
			param.setFollowUserId(usrId);
			ModelResult<Boolean> modelResult = userConsumerServiceClient.followUser(param);
			if (!modelResult.isSuccess()) {
				logger.info("关注或取消关注接口，调用接口返回错误，type={}，usrId={}, errMsg={}", type, usrId, modelResult.getErrorMsg());
				return CommonResponse.withErrorResp(modelResult.getErrorMsg());
			}
			return CommonResponse.withSuccessResp(modelResult.getModel());
		} catch (Exception e) {
			logger.info("关注或取消关注接口，发生异常，type={}，usrId={}, exception={}", type, usrId, e.getMessage(), e);
			return CommonResponse.withErrorResp(e.getMessage());
		}
	}
	
	@RequestMapping(value = "/pageFollowedUser", produces = "application/json; charset=utf-8", method = RequestMethod.POST)
	@ApiOperation(value = "分页查询关注的用户接口", httpMethod = "POST", consumes = "application/x-www-form-urlencoded", produces = "application/json")
	@ApiResponse(code = 200, message = "分页查询关注的用户接口", response = CommonResponse.class)
	@ResponseBody
	public CommonResponse<FollowedUserPageQueryResult> pageFollowedUser(FollowedUserRequest followedUserRequest, HttpServletRequest request) {
		try {
			UserConsumer userConsumer = getLoginUsr(request);
			if (userConsumer == null) {
				logger.info("分页查询关注的用户接口,未获取到登录用户信息,");
				return CommonResponse.withErrorResp("未获取到登录用户信息");
			}
			FollowedUserPageQueryParam param = new FollowedUserPageQueryParam();
			param.setUserId(userConsumer.getId());
			param.setPageNo(followedUserRequest.getPageNo());
			param.setPageSize(followedUserRequest.getPageSize());
			param.setFollowType(followedUserRequest.getFollowType());
			ModelResult<FollowedUserPageQueryResult> modelResult = userConsumerServiceClient.pageQueryFollowedUser(param);
			if (!modelResult.isSuccess()) {
				logger.info("分页查询关注的用户接口,调用接口返回错误,errorMsg={}", modelResult.getErrorMsg());
				return CommonResponse.withErrorResp("调用接口返回错误,errorMsg=" + modelResult.getErrorMsg());
			}
			FollowedUserPageQueryResult model = modelResult.getModel();
			List<FollowedUserVo> followedUserList = model.getFollowedUserList();

			//用户为专家的，改为使用专家名
			{
				if (CollUtil.isEmpty(followedUserList)){
					followedUserList = Lists.newArrayList();
				}
			}
			for (FollowedUserVo followedUserVo : followedUserList) {
				ModelResult<RecExpert> recExpertModelResult = recExpertServiceClient.queryByUserId(followedUserVo.getUserId());
				if (recExpertModelResult != null && recExpertModelResult.isSuccess() && recExpertModelResult.getModel() != null) {
					RecExpert recExpert = recExpertModelResult.getModel();
					followedUserVo.setUserNickName(recExpert.getNickName());
				}
			}
//			List<Long> userIdList = followedUserList.stream().map(followedUserVo -> followedUserVo.getUserId()).collect(Collectors.toList());
//			//获取热门专家列表
//			RecExpertQueryVo queryVo = new RecExpertQueryVo();
//			DataPage<RecExpert> dataPage = new DataPage<>();
//			dataPage.setPageSize(10);
//			dataPage.setPageNo(1);
//			queryVo.setNeedAttach(true);
//			queryVo.setStatus(RecExpertStatus.EFFECTIVE.getIndex());
//			queryVo.setIsRecommend(RecommendStatus.POPULAR.getIndex());
//			PageResult<RecExpert> pageResult = recExpertServiceClient.queryPage(queryVo, dataPage);
//			if (pageResult.isSuccess()) {
//				/*添加热门专家为关注列表*/
//				List<RecExpert> recExpertList = pageResult.getPage().getDataList();
//				if (CollectionUtil.isNotEmpty(recExpertList)) {
//					recExpertList = recExpertList.stream().sorted(Comparator.comparing(RecExpert::getOrderNumber)).collect(Collectors.toList());
//					for (RecExpert recExpert : recExpertList) {
//						//去掉专家自己
//						if (userConsumer.getId().equals(recExpert.getUserId())) {
//							continue;
//						}
//						//已关注过该专家
//						if (userIdList.contains(recExpert.getUserId())){
//							continue;
//						}
//						FollowedUserVo followedUserVo = new FollowedUserVo();
//						followedUserVo.setUserNickName(recExpert.getNickName());
//						ModelResult<UserConsumer> userConsumerModelResult = userConsumerServiceClient
//								.queryConsumerById(recExpert.getUserId(), new UserConsumerQueryOption());
//						UserConsumer consumer = userConsumerModelResult.getModel();
//						if (consumer == null) {
//							logger.info(logPrefix+"pageFollowedUser-查询关注列表，没有用户：【{}】信息，",recExpert.getUserId());
//							continue;
//						}
//						followedUserVo.setFans(consumer.getFans());
//						followedUserVo.setUserIcon(consumer.getIcon());
//						followedUserVo.setUserId(consumer.getId());
//						followedUserVo.setFollowStatus(FollowStatus.CANCEL.getIndex());
//						followedUserList.add(followedUserVo);
//					}
//				}
//
//			}

			model.setFollowedUserList(followedUserList);
			return CommonResponse.withSuccessResp(model);
		} catch (Exception e) {
			logger.info("分页查询关注的用户接口,发生异常,exception={}", e.getMessage(), e);
			return CommonResponse.withErrorResp(e.getMessage());
		}
	}
	
	@RequestMapping(value = "/allFollowedUser", produces = "application/json; charset=utf-8", method = RequestMethod.POST)
	@ApiOperation(value = "查询全部的关注用户接口", httpMethod = "POST", consumes = "application/x-www-form-urlencoded", produces = "application/json")
	@ApiResponse(code = 200, message = "查询全部的关注用户接口", response = CommonResponse.class)
	@ResponseBody
	public CommonResponse<List<FollowedUserVo>> allFollowedUser(HttpServletRequest request) {
		try {
			UserConsumer userConsumer = getLoginUsr(request);
			if (userConsumer == null) {
				logger.info("查询全部的关注用户接口,未获取到登录用户信息,");
				return CommonResponse.withErrorResp("未获取到登录用户信息");
			}
			ModelResult<List<FollowedUserVo>> modelResult = userConsumerServiceClient.queryAllFollowedUser(userConsumer.getId());
			if (!modelResult.isSuccess()) {
				logger.info("查询全部的关注用户接口,调用接口返回错误,errorMsg={}", modelResult.getErrorMsg());
				return CommonResponse.withErrorResp("调用接口返回错误,errorMsg=" + modelResult.getErrorMsg());
			}
			return CommonResponse.withSuccessResp(modelResult.getModel());
		} catch (Exception e) {
			logger.info("查询全部的关注用户接口,发生异常,exception={}", e.getMessage(), e);
			return CommonResponse.withErrorResp(e.getMessage());
		}
	}

	@RequestMapping(value = "/updateUserInfo", produces = "application/json; charset=utf-8", method = RequestMethod.POST)
	@ApiOperation(value = "修改用户个人信息", httpMethod = "POST", consumes = "multipart/form-data", produces = "application/json")
	@ApiResponse(code = 200, message = "修改用户个人信息", response = CommonResponse.class)
	@ResponseBody
	public CommonResponse<UserCenterInfoVo> updateUserInfo(HttpServletRequest request, MultipartFile[] files, UserInfoRequest userInfoRequest) {
		try {
			UserConsumer userConsumer = getLoginUsr(request);
			if (userConsumer == null) {
				logger.info("查询全部的关注用户接口,未获取到登录用户信息,");
				return CommonResponse.withErrorResp("未获取到登录用户信息");
			}
			if (userInfoRequest!=null){
				BeanUtil.copyProperties(userInfoRequest,userConsumer, CopyOptions.create().setIgnoreNullValue(true));
			}
			if (files!=null && files.length>0){
				if (files[0].getSize()>5242880){
					return CommonResponse.withErrorResp("修改失败，图片不能超过5M");
				}

				String uploadImage = uploadImage(files, userConsumer.getId());
				if (StringUtils.isEmpty(uploadImage)){
					return CommonResponse.withErrorResp("头像修改失败");
				}
				userConsumer.setIcon(uploadImage);
			}

			ModelResult<Integer> modelResult = userConsumerServiceClient.updateConsumerInfo(userConsumer, new UserOperationParam());
			if (modelResult!=null && modelResult.isSuccess() && modelResult.getModel()!=null) {
				UserCenterInfoVo infoVo = new UserCenterInfoVo();
				BeanUtils.copyProperties(userConsumer,infoVo);
				/** 更新成功后，刷新session缓存的用户信息 */
				MemberSession memberSession = updateMemberSession(request);
				if (memberSession==null){
					logger.warn("修改用户【{}】信息,更新用户session信息失败",userConsumer.getId());
				}

				return CommonResponse.withSuccessResp(infoVo);
			}
			logger.error("用户信息修改失败，失败原因：{}",modelResult.getErrorMsg());
			return CommonResponse.withErrorResp("修改失败");


		} catch (Exception e) {
			logger.info("用户信息修改失败,发生异常,exception={}", e.getMessage(), e);
			return CommonResponse.withErrorResp(e.getMessage());
		}
	}


	@RequestMapping(value = "/checkBindingPhone", produces = "application/json; charset=utf-8", method = RequestMethod.POST)
	@ApiOperation(value = "检查用户是否绑定手机", httpMethod = "POST", consumes = "multipart/form-data", produces = "application/json")
	@ApiResponse(code = 200, message = "检查用户是否绑定手机", response = CommonResponse.class)
	@ResponseBody
	public CommonResponse checkBindingPhone(HttpServletRequest request){
		UserConsumer loginUsr = getLoginUsr(request);
		if (null==loginUsr){
		    return CommonResponse.withSuccessResp("请先登录！");
		}
		Long id = loginUsr.getId();
		ModelResult<UserConsumer> userConsumerModelResult = userConsumerServiceClient.queryConsumerById(id, null);
		UserConsumer model = userConsumerModelResult.getModel();
		if (!userConsumerModelResult.isSuccess() || null==model){
			logger.info("查询用户是否绑定手机,errorMsg={}", userConsumerModelResult.getErrorMsg());
			return CommonResponse.withErrorResp("调用接口返回错误,errorMsg=" + userConsumerModelResult.getErrorMsg());
		}
		if (StrUtil.isNotBlank(model.getPhone())){
		    return CommonResponse.withSuccessResp(Boolean.TRUE);
		}
		return CommonResponse.withSuccessResp(Boolean.FALSE);
	}


	//发送手机验证码
	@RequestMapping(value = "/sendPhoneCode", method = RequestMethod.POST)
	@ResponseBody
	public CommonResponse sendPhoneCode(String phone,Integer smsType,HttpServletRequest request, HttpServletResponse response){
		SendSmsEnum sendSmsEnum = SendSmsEnum.getSendSmsEnumByType(smsType);
		String logPrefix="";
		if (null== sendSmsEnum){
		    return CommonResponse.withErrorResp("错误的短信类型！");
		}
		try {
			logPrefix=sendSmsEnum.getLogPrefix();
			Map<String, String> m = smsManager.checkUserIpSendSms(phone, request, response, logPrefix);
			UserConsumer userConsumer = getLoginUsr(request);
			CommonResponse commonResponse = smsManager.checkSmsCondition(sendSmsEnum, userConsumer, phone);
			if (commonResponse.getCode().equals(ResponseConstant.RESP_ERROR_CODE)){
			    return commonResponse;
			}
			String cacheKey = StrUtil.format(sendSmsEnum.getCacheKey(), phone);
			if (redisClientManager.hasKey(cacheKey)){
				//重复获取短信验证码
				logger.info(logPrefix + "5分钟之内请勿重复获取验证码，phone={}", phone);
				return CommonResponse.withErrorResp("请勿频繁获取验证码");
			}


			SendALiYunSmsParam sendALiYunSmsParam = new SendALiYunSmsParam();
			sendALiYunSmsParam.setPhone(phone);
			sendALiYunSmsParam.setLogPrefix(logPrefix);
			sendALiYunSmsParam.setRequest(request);
			sendALiYunSmsParam.setSendSmsEnum(sendSmsEnum);
			String code = smsManager.sendALiyunSms(sendALiYunSmsParam);
			smsManager.increaseValidCodeCount(m.get("ip"), m.get("ua"));
			smsManager.increaseValidCodeCount(m.get("ip"));
			smsManager.increaseValidCodeCookieCount(request, response);
			redisClientManager.setEx(cacheKey, code, 5, TimeUnit.MINUTES);
			return CommonResponse.withSuccessResp(Boolean.TRUE);
		} catch (Exception e) {
			logger.info(logPrefix + "发生异常exception={}", e.getMessage(), e);
			return CommonResponse.withErrorResp(e.getMessage());
		}
	}

	private String uploadImage(MultipartFile[] files, Long userId) {
		String imageUrl = "";
		try {
			for (int i = 0; i < files.length; i++) {
				String fileName = files[i].getOriginalFilename();
				if (StringUtils.isNotBlank(fileName)) {
					//创建输出文件对象
					String suffix = "";
					if (fileName.contains(".jpeg")){
						 suffix = fileName.substring(fileName.length() - 5, fileName.length());
					}else {
						 suffix = fileName.substring(fileName.length() - 4, fileName.length());
					}

					File outFile = FileUtils.getFile(
							uploadPath + File.separator + UUID.randomUUID().toString().replaceAll("-", "").substring(0, 10) + "_" + userId + suffix);
					//拷贝文件到输出文件对象
					FileUtils.copyInputStreamToFile(files[0].getInputStream(), outFile);
					imageUrl = outFile.getPath().replace(uploadPath, resPath);
				}
			}
		} catch (IOException e) {
			e.printStackTrace();
			logger.info("上传个人头像图片出错", e.getMessage());
		}
		return imageUrl;


	}


	@RequestMapping(value = "/realNameCheck", produces = "application/json; charset=utf-8", method = RequestMethod.POST)
	@ApiOperation(value = "实名认证用户个人信息", httpMethod = "POST", consumes = "multipart/form-data", produces = "application/json")
	@ApiResponse(code = 200, message = "实名认证用户个人信息", response = CommonResponse.class)
	@ResponseBody
	public CommonResponse<UserCenterInfoVo> realNameCheck(HttpServletRequest request, UserInfoRequest userInfoRequest,String code) {
		if (StrUtil.isBlank(userInfoRequest.getPhone()) || StrUtil.isBlank(code)) {
			return CommonResponse.withErrorResp("请填写正确的手机号码与验证码！");
		}
		try {
			UserConsumer userConsumer = getLoginUsr(request);
			if (userConsumer == null) {
				logger.info("实名认证用户个人信息,未获取到登录用户信息,");
				return CommonResponse.withErrorResp("未获取到登录用户信息");
			}
			// 检查手机
			RegisterValidUtil.validPhone(userInfoRequest.getPhone());
			String cacheKey = StrUtil.format(SendSmsEnum.REAL_NAME_AUTHENTICATION.getCacheKey(), userInfoRequest.getPhone());
			String s = redisClientManager.get(cacheKey);
			if (StrUtil.isBlank(s)) {
				return CommonResponse.withErrorResp("验证码已失效！");
			}
			if (!code.equalsIgnoreCase(s)) {
				return CommonResponse.withErrorResp("验证码错误！");
			}
			//不修改手机号码
			userInfoRequest.setPhone(null);
			if (userInfoRequest!=null){
				BeanUtil.copyProperties(userInfoRequest,userConsumer, CopyOptions.create().setIgnoreNullValue(true));
			}

			ModelResult<Integer> modelResult = userConsumerServiceClient.updateConsumerInfo(userConsumer, new UserOperationParam());
			if (modelResult!=null && modelResult.isSuccess() && modelResult.getModel()!=null) {
				UserCenterInfoVo infoVo = new UserCenterInfoVo();
				BeanUtils.copyProperties(userConsumer,infoVo);
				/** 更新成功后，刷新session缓存的用户信息 */
				MemberSession memberSession = updateMemberSession(request);
				if (memberSession==null){
					logger.warn("修改用户【{}】信息,更新用户session信息失败",userConsumer.getId());
				}
				return CommonResponse.withSuccessResp(infoVo);
			}
			logger.error("实名认证用户个人信息，失败原因：{}",modelResult.getErrorMsg());
			return CommonResponse.withErrorResp("修改失败");

		} catch (Exception e) {
			logger.info("实名认证用户个人信息,发生异常,exception={}", e.getMessage(), e);
			return CommonResponse.withErrorResp(e.getMessage());
		}
	}

	
}
