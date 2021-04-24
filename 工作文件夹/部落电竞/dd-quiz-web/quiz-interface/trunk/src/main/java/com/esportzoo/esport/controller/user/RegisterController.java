package com.esportzoo.esport.controller.user;

import cn.hutool.core.collection.CollectionUtil;
import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson.JSON;
import com.esportzoo.common.appmodel.domain.result.ModelResult;
import com.esportzoo.common.util.CookieUtils;
import com.esportzoo.common.util.RsaCryptoUtil;
import com.esportzoo.esport.client.service.consumer.UserConsumerServiceClient;
import com.esportzoo.esport.client.service.sms.SmsLogServiceClient;
import com.esportzoo.esport.connect.request.user.GainPhoneValidCodeRequest;
import com.esportzoo.esport.connect.request.user.ResetPasswordValidCodeRequest;
import com.esportzoo.esport.connect.response.BindingPhoneResponse;
import com.esportzoo.esport.connect.response.CommonResponse;
import com.esportzoo.esport.constant.ResponseConstant;
import com.esportzoo.esport.constants.BizSystem;
import com.esportzoo.esport.constants.RegisterType;
import com.esportzoo.esport.constants.UserConsumerStatus;
import com.esportzoo.esport.constants.UserOperationParam;
import com.esportzoo.esport.constants.sms.*;
import com.esportzoo.esport.constants.user.MemberConstants;
import com.esportzoo.esport.controller.BaseController;
import com.esportzoo.esport.domain.SmsLog;
import com.esportzoo.esport.domain.UserConsumer;
import com.esportzoo.esport.manager.RedisClientManager;
import com.esportzoo.esport.manager.sms.SmsManager;
import com.esportzoo.esport.service.exception.BusinessException;
import com.esportzoo.esport.service.exception.RegisterException;
import com.esportzoo.esport.service.exception.errorcode.UserConsumerErrorTable;
import com.esportzoo.esport.service.sms.AliYunShortMessageService;
import com.esportzoo.esport.util.RegisterValidUtil;
import com.esportzoo.esport.util.RequestUtil;
import com.esportzoo.esport.vo.UserConsumerQueryVo;
import com.esportzoo.esport.vo.sms.AliYunSendSmsParam;
import com.esportzoo.esport.vo.user.PhoneRegisterRequest;
import com.esportzoo.esport.vo.user.ResetPasswordRequest;
import com.esportzoo.esport.vo.user.ValidRegisterCodeRequest;
import com.esportzoo.esport.vo.user.ValidRegisterCodeResponse;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * @author tingting.shen
 * @date 2019/07/15
 */
@Controller
@RequestMapping("regist")
public class RegisterController extends BaseController {

    private transient final Logger logger = LoggerFactory.getLogger(getClass());

    private static final String VALID_CODE_COUNT_IP_UA = "valid_code_count_ip_ua_";
    private static final String VALID_CODE_COUNT_IP = "valid_code_count_ip_";
    private static final String VALID_CODE_COUNT_COOKIE_KEY = "valid_code_count_cookie_key";
    private static final String PHONE_REGISTER_VALID_CODE = "phone_register_valid_code_";
    private static final String RESET_PASSWORD_VALID_CODE_ = "reset_password_valid_code_";

    @Autowired
    private RedisClientManager redisClientManager;
    @Autowired
    private UserConsumerServiceClient userConsumerServiceClient;
    @Autowired
    private AliYunShortMessageService aliYunShortMessageService;
    @Autowired
    private SmsLogServiceClient smsLogServiceClient;
    @Autowired
    private SmsManager smsManager;

    @RequestMapping(value = "/gainPhoneRegistValidCode", method = RequestMethod.POST)
    @ResponseBody
    public CommonResponse<String> gainPhoneRegistValidCode(GainPhoneValidCodeRequest gainCodeRequest, HttpServletRequest request, HttpServletResponse response) {
        String logPrefix = "获取手机验证码_";
        try {
            Map<String, String> m = smsManager.checkUserIpSendSms(gainCodeRequest.getPhone(), request, response, logPrefix);

            String cacheKey = PHONE_REGISTER_VALID_CODE + gainCodeRequest.getPhone();
            if (redisClientManager.hasKey(cacheKey)) {
                logger.info(logPrefix + "5分钟之内请勿重复获取验证码，phone={}", gainCodeRequest.getPhone());
                return CommonResponse.withErrorResp("请勿频繁获取验证码");
            }

            UserConsumerQueryVo queryVo = new UserConsumerQueryVo();
            queryVo.setPhone(gainCodeRequest.getPhone());
            queryVo.setRegisterType(RegisterType.phone_register.getIndex());
            ModelResult<List<UserConsumer>> modelResult = userConsumerServiceClient.queryList(queryVo);
            if (modelResult.isSuccess() && modelResult.getModel() != null && modelResult.getModel().size() > 0) {
                logger.info(logPrefix + "该手机号码已经注册过了，phone={}", gainCodeRequest.getPhone());
                return CommonResponse.withErrorResp("该手机号码已经注册过了");
            }

            AliYunSendSmsParam param = new AliYunSendSmsParam();
            param.setPhone(gainCodeRequest.getPhone());
            param.setSignName("橘子电竞");
            param.setTemplateCode(SmsTemplateCodeEnum.PHONE_REGISTER_CODE.getCode());
            param.setContentType(ShortMessageContentType.REGISTER_VALID_CODE);
            Map<String, String> templateParam = new HashMap<String, String>();
            String code = String.valueOf((new Random().nextInt(8999) + 1000));
            logger.info(logPrefix + "获得验证码，phone={}，code={}", gainCodeRequest.getPhone(), code);
            templateParam.put("code", code);
            param.setTemplateParam(templateParam);
            //发送验证码，区分daily
            Integer flag = smsManager.toSendSms(request, param, logPrefix);
            if (flag==ToSendSmsExceptionType.ALIYUN_SEND.getIndex()){
                return CommonResponse.withErrorResp("调用阿里云短信发送接口返回错误");
            }else if (flag==ToSendSmsExceptionType.SMS_INFO_INSERT_DB.getIndex()){
                return CommonResponse.withErrorResp("验证码入库错误");
            }else if (flag == ToSendSmsExceptionType.SMS_SEND_PHONE_LIMIT.getIndex()){
                return CommonResponse.withErrorResp(UserConsumerErrorTable.SMS_SEND_PHONE_LIMIT.getMsg());
            }
            smsManager.increaseValidCodeCount(m.get("ip"), m.get("ua"));
            smsManager.increaseValidCodeCount(m.get("ip"));
            smsManager.increaseValidCodeCookieCount(request, response);
            redisClientManager.setEx(cacheKey, code, 5, TimeUnit.MINUTES);

            return CommonResponse.withSuccessResp(code);
        } catch (RegisterException re) {
            logger.info(logPrefix + "发生注册异常exception={}", re.getMessage(), re);
            return CommonResponse.withErrorResp(re.getMessage());
        } catch (Exception e) {
            logger.info(logPrefix + "发生异常exception={}", e.getMessage(), e);
            return CommonResponse.withErrorResp(e.getMessage());
        }
    }

    @RequestMapping(value = "/validRegisterCode", method = RequestMethod.POST)
    @ResponseBody
    public CommonResponse<ValidRegisterCodeResponse> validRegisterCode(ValidRegisterCodeRequest validRegisterCodeRequest) {
        String logPrefix = "验证注册验证码_";
        try {
            String phone = validRegisterCodeRequest.getPhone();
            String code = validRegisterCodeRequest.getCode();
            Integer type = validRegisterCodeRequest.getType();
            if (StringUtils.isBlank(phone) || StringUtils.isBlank(code) || type == null) {
                logger.info(logPrefix + "必要参数为空");
                return CommonResponse.withErrorResp("必要参数为空");
            }
            if (type != 1 && type != 2) {
                logger.info(logPrefix + "type取值不对");
                return CommonResponse.withErrorResp("type取值不对");
            }
            String cacheKey = type == 1 ? (PHONE_REGISTER_VALID_CODE + phone) : (RESET_PASSWORD_VALID_CODE_ + phone);
            if (!redisClientManager.hasKey(cacheKey)) {
                logger.info(logPrefix + "验证码失效");
                return CommonResponse.withErrorResp("验证码失效");
            }
            String cacheCode = redisClientManager.get(cacheKey);
            if (!code.equals(cacheCode)) {
                logger.info(logPrefix + "验证码不正确");
                return CommonResponse.withErrorResp("验证码不正确");
            }
            ValidRegisterCodeResponse response = new ValidRegisterCodeResponse();
            response.setPhone(phone);
            response.setCode(code);
            response.setValidPass(true);
            return CommonResponse.withSuccessResp(response);
        } catch (Exception e) {
            logger.info(logPrefix + "发生异常exception={}", e.getMessage(), e);
            return CommonResponse.withErrorResp(e.getMessage());
        }
    }

    @RequestMapping(value = "/phoneRegister", method = RequestMethod.POST)
    @ResponseBody
    public CommonResponse<Boolean> phoneRegister(PhoneRegisterRequest phoneRegisterRequest, HttpServletRequest request) {
        String logPrefix = "手机注册_";
        logger.info(logPrefix + "手机注册接收参数phoneRegisterRequest={}", JSON.toJSONString(phoneRegisterRequest));
        try {
            String phone = phoneRegisterRequest.getPhone();
            String code = phoneRegisterRequest.getCode();
            // String account = phoneRegisterRequest.getAccount();
            String encryPassword1 = phoneRegisterRequest.getPassword();
            String encryPassword2 = phoneRegisterRequest.getRepetPassword();
            if (StringUtils.isBlank(phone) || StringUtils.isBlank(code)
                    || StringUtils.isBlank(encryPassword1) || StringUtils.isBlank(encryPassword2)) {
                logger.info(logPrefix + "必要参数为空");
                return CommonResponse.withErrorResp("必要参数为空");
            }
            if (!encryPassword1.equals(encryPassword2)) {
                logger.info(logPrefix + "密码不一致");
                return CommonResponse.withErrorResp("密码不一致");
            }
            String cacheKey = PHONE_REGISTER_VALID_CODE + phone;
            if (!redisClientManager.hasKey(cacheKey)) {
                logger.info(logPrefix + "验证码失效");
                return CommonResponse.withErrorResp("验证码失效");
            }
            String cacheCode = redisClientManager.get(cacheKey);
            if (!code.equals(cacheCode)) {
                logger.info(logPrefix + "验证码不正确");
                return CommonResponse.withErrorResp("验证码不正确");
            }
            String password = RsaCryptoUtil.decryptByPrivateKey(encryPassword1, RsaCryptoUtil.privateKey, null);
            //RegisterValidUtil.validAccount(account);
            RegisterValidUtil.validPassword(password);
            RegisterValidUtil.validPhone(phone);
            UserConsumerQueryVo queryVo = new UserConsumerQueryVo();
            queryVo.setPhone(phone);
            queryVo.setRegisterType(RegisterType.phone_register.getIndex());
            ModelResult<List<UserConsumer>> modelResult = userConsumerServiceClient.queryList(queryVo);
            if (modelResult.isSuccess() && modelResult.getModel() != null && modelResult.getModel().size() > 0) {
                logger.info(logPrefix + "该手机号码已经注册过了，phone={}", phone);
                return CommonResponse.withErrorResp("该手机号码已经注册过了");
            }
			/*UserConsumerQueryVo queryVo1 = new UserConsumerQueryVo();
			queryVo1.setAccount(account);
			ModelResult<List<UserConsumer>> modelResult1 = userConsumerServiceClient.queryList(queryVo1);
			if (modelResult1.isSuccess() && modelResult1.getModel() != null && modelResult1.getModel().size() > 0) {
				logger.info(logPrefix + "该用户名已经注册过了，account={}", account);
				return CommonResponse.withErrorResp("该用户名已经注册过了");
			}*/
            UserOperationParam usrOperationParm = new UserOperationParam(RequestUtil.getClientIp(request), phoneRegisterRequest.getClientType(),
                    phoneRegisterRequest.getAgentId(), phoneRegisterRequest.getVersion());
            UserConsumer reqMember = new UserConsumer();
            ModelResult<Long> maxIdResult = userConsumerServiceClient.queryMaxId();
            if (null == maxIdResult || null == maxIdResult.getModel()) {
                logger.info(logPrefix + "查询queryMaxId接口异常，phone={}", phone);
                return CommonResponse.withErrorResp("注册异常");
            }
            String account = MemberConstants.USER_ACCOUNT_AND_NICKNAME_PREFIX + maxIdResult.getModel();
            reqMember.setAccount(account);
            reqMember.setNickName(account);
            reqMember.setPassword(password);
            reqMember.setPhone(phone);
            reqMember.setStatus(UserConsumerStatus.VALID.getIndex());
            reqMember.setRegisterTime(new Date());
            reqMember.setLastLoginTime(new Date());
            reqMember.setRegisterType(RegisterType.phone_register.getIndex());
            reqMember.setBizSystem(BizSystem.LOCAL.getIndex());
            ModelResult<UserConsumer> modelResult3 = userConsumerServiceClient.register(reqMember, usrOperationParm);
            if (!modelResult3.isSuccess()) {
                logger.info(logPrefix + "注册失败,失败信息={}", modelResult3.getErrorMsg());
                throw new BusinessException(ResponseConstant.RESP_PARAM_ERROR_CODE, modelResult3.getErrorMsg());
            } else if (modelResult3.getModel() == null) {
                logger.info(logPrefix + "注册失败,没有返回注册用户");
                throw new BusinessException(ResponseConstant.RESP_PARAM_ERROR_CODE, "没有返回注册用户");
            }
            UserConsumer user = modelResult3.getModel();
            logger.info(logPrefix + "注册成功，userId={}", user.getId());
            return CommonResponse.withSuccessResp(true);
        } catch (RegisterException re) {
            logger.info(logPrefix + "发生注册异常exception={}", re.getMessage(), re);
            return CommonResponse.withErrorResp(re.getMessage());
        } catch (BusinessException be) {
            logger.info(logPrefix + "发生业务异常exception={}", be.getMessage(), be);
            return CommonResponse.withErrorResp(be.getMessage());
        } catch (Exception e) {
            logger.info(logPrefix + "发生异常exception={}", e.getMessage(), e);
            return CommonResponse.withErrorResp(e.getMessage());
        }
    }

    @RequestMapping(value = "/resetPasswordValidCode", method = RequestMethod.POST)
    @ResponseBody
    public CommonResponse<String> gainPhoneRegistValidCode(ResetPasswordValidCodeRequest gainCodeRequest, HttpServletRequest request, HttpServletResponse response) {
        String logPrefix = "重置密码获取手机验证码_";
        try {
            Map<String, String> m = smsManager.checkUserIpSendSms(gainCodeRequest.getPhone(), request, response, logPrefix);

            String cacheKey = RESET_PASSWORD_VALID_CODE_ + gainCodeRequest.getPhone();
            if (redisClientManager.hasKey(cacheKey)) {
                logger.info(logPrefix + "1分钟之内请勿重复获取验证码，phone={}", gainCodeRequest.getPhone());
                return CommonResponse.withErrorResp("请勿频繁获取验证码");
            }

            UserConsumerQueryVo queryVo = new UserConsumerQueryVo();
            queryVo.setPhone(gainCodeRequest.getPhone());
            /*queryVo.setRegisterType(RegisterType.phone_register.getIndex());*/
            ModelResult<List<UserConsumer>> modelResult = userConsumerServiceClient.queryList(queryVo);
            if (!modelResult.isSuccess()) {
                logger.info(logPrefix + "根据手机号查询出错，phone={},errMsg={}", gainCodeRequest.getPhone(), modelResult.getErrorMsg());
                return CommonResponse.withErrorResp(modelResult.getErrorMsg());
            }
            List<UserConsumer> userList = modelResult.getModel();
            if (userList == null) {
                logger.info(logPrefix + "该手机号码还没有注册，phone={}", gainCodeRequest.getPhone());
                return CommonResponse.withErrorResp("该手机号码还没有注册");
            }
            if (userList.size() != 1) {
                logger.info(logPrefix + "该手机号码可能存在多条绑定记录，phone={} userList.size={}", gainCodeRequest.getPhone(), userList.size());
                return CommonResponse.withErrorResp("手机号码异常");
            }

            AliYunSendSmsParam param = new AliYunSendSmsParam();
            param.setPhone(gainCodeRequest.getPhone());
            param.setSignName("橘子电竞");
            param.setTemplateCode(SmsTemplateCodeEnum.RESET_PASSWORD.getCode());
            param.setContentType(ShortMessageContentType.RESETPASSWORD_VALID_CODE);
            Map<String, String> templateParam = new HashMap<String, String>();
            String code = String.valueOf((new Random().nextInt(8999) + 1000));
            logger.info(logPrefix + "获得验证码，phone={}，code={}", gainCodeRequest.getPhone(), code);
            templateParam.put("code", code);
            param.setTemplateParam(templateParam);

            //发送验证码，区分daily
            Integer flag = smsManager.toSendSms(request, param, logPrefix);
            if (flag==ToSendSmsExceptionType.ALIYUN_SEND.getIndex()){
                return CommonResponse.withErrorResp("调用阿里云短信发送接口返回错误");
            }else if (flag==ToSendSmsExceptionType.SMS_INFO_INSERT_DB.getIndex()){
                return CommonResponse.withErrorResp("验证码入库错误");
            }else if (flag == ToSendSmsExceptionType.SMS_SEND_PHONE_LIMIT.getIndex()){
                return CommonResponse.withErrorResp(UserConsumerErrorTable.SMS_SEND_PHONE_LIMIT.getMsg());
            }
            smsManager.increaseValidCodeCount(m.get("ip"), m.get("ua"));
            smsManager.increaseValidCodeCount(m.get("ip"));
            smsManager.increaseValidCodeCookieCount(request, response);
            redisClientManager.setEx(cacheKey, code, 3, TimeUnit.MINUTES);

            return CommonResponse.withSuccessResp(code);
        } catch (RegisterException re) {
            logger.info(logPrefix + "发生注册异常exception={}", re.getMessage(), re);
            return CommonResponse.withErrorResp(re.getMessage());
        } catch (Exception e) {
            logger.info(logPrefix + "发生异常exception={}", e.getMessage(), e);
            return CommonResponse.withErrorResp(e.getMessage());
        }
    }

    @RequestMapping(value = "/resetPassword", method = RequestMethod.POST)
    @ResponseBody
    public CommonResponse<Boolean> resetPassword(ResetPasswordRequest resetPasswordRequest, HttpServletRequest request) {
        String logPrefix = "重置密码_";
        logger.info(logPrefix + "接收参数phoneRegisterRequest={}", JSON.toJSONString(resetPasswordRequest));
        try {
            String phone = resetPasswordRequest.getPhone();
            String code = resetPasswordRequest.getCode();
            String encryPassword1 = resetPasswordRequest.getPassword();
            String encryPassword2 = resetPasswordRequest.getRepetPassword();
            if (StringUtils.isBlank(phone) || StringUtils.isBlank(code)
                    || StringUtils.isBlank(encryPassword1) || StringUtils.isBlank(encryPassword2)) {
                logger.info(logPrefix + "必要参数为空");
                return CommonResponse.withErrorResp("必要参数为空");
            }
            String cacheKey = RESET_PASSWORD_VALID_CODE_ + phone;
            if (!redisClientManager.hasKey(cacheKey)) {
                logger.info(logPrefix + "验证码失效");
                return CommonResponse.withErrorResp("验证码失效");
            }
            String cacheCode = redisClientManager.get(cacheKey);
            if (!code.equals(cacheCode)) {
                logger.info(logPrefix + "验证码不正确");
                return CommonResponse.withErrorResp("验证码不正确");
            }
            if (!encryPassword1.equals(encryPassword2)) {
                logger.info(logPrefix + "密码不一致");
                return CommonResponse.withErrorResp("密码不一致");
            }
            String password = RsaCryptoUtil.decryptByPrivateKey(encryPassword1, RsaCryptoUtil.privateKey, null);
            logger.info(logPrefix + "password={}, encryPassword={}", password, encryPassword1);
            RegisterValidUtil.validPhone(phone);
            RegisterValidUtil.validPassword(password);
            UserConsumerQueryVo queryVo = new UserConsumerQueryVo();
            queryVo.setPhone(phone);
            ModelResult<List<UserConsumer>> modelResult = userConsumerServiceClient.queryList(queryVo);
            if (!modelResult.isSuccess() || modelResult.getModel() == null || modelResult.getModel().size() <= 0) {
                logger.info(logPrefix + "该手机号码还没有注册，phone={}", phone);
                return CommonResponse.withErrorResp("该手机号码还没有注册");
            }
            if (1!=modelResult.getModel().size()){
                logger.info(logPrefix + "该手机号码存在多个绑定，phone={} size[{}]", phone,modelResult.getModel().size());
                return CommonResponse.withErrorResp("该手机号异常");
            }
            UserConsumer user = modelResult.getModel().get(0);
            UserOperationParam usrOperationParm = new UserOperationParam();
            ModelResult<UserConsumer> modelResult1 = userConsumerServiceClient.resetPassword(user.getId(), password, usrOperationParm);
            if (!modelResult1.isSuccess()) {
                logger.info(logPrefix + "失败，phone={}", phone);
                return CommonResponse.withErrorResp("重置失败");
            }
            logger.info(logPrefix + "成功，userId={}", user.getId());
            return CommonResponse.withSuccessResp(true);
        } catch (RegisterException re) {
            logger.info(logPrefix + "发生注册异常exception={}", re.getMessage(), re);
            return CommonResponse.withErrorResp(re.getMessage());
        } catch (BusinessException be) {
            logger.info(logPrefix + "发生业务异常exception={}", be.getMessage(), be);
            return CommonResponse.withErrorResp(be.getMessage());
        } catch (Exception e) {
            logger.info(logPrefix + "发生异常exception={}", e.getMessage(), e);
            return CommonResponse.withErrorResp(e.getMessage());
        }
    }


}
