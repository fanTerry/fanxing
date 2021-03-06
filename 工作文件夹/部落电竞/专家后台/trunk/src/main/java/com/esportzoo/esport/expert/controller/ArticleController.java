package com.esportzoo.esport.expert.controller;

import java.text.ParseException;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.esportzoo.common.appmodel.domain.result.PageResult;
import com.esportzoo.common.appmodel.page.DataPage;
import com.esportzoo.esport.client.service.expert.RecExpertColumnArticleServiceClient;
import com.esportzoo.esport.constants.cms.expert.ExpertArticleStatus;
import com.esportzoo.esport.domain.RecExpert;
import com.esportzoo.esport.domain.RecExpertColumnArticle;
import com.esportzoo.esport.expert.result.ReturnResult;
import com.esportzoo.esport.vo.expert.ExpertArticleContent;
import com.esportzoo.esport.vo.expert.RecExpertColumnArticleQueryVo;

/**
 * @author tingting.shen
 * @date 2019/05/27
 */
@Controller
@RequestMapping(value = "/article")
public class ArticleController extends BaseController{
	
	@Autowired
	private RecExpertColumnArticleServiceClient recExpertColumnArticleServiceClient;
	
	@RequestMapping(value = "list")
	public String list(Model model, HttpServletRequest request){
		RecExpert expert = getLoginExpert(request);
		if (expert == null) {
			return "";
		}
		model.addAttribute("nickName", expert.getNickName());
		model.addAttribute("statusList", ExpertArticleStatus.getAllList());
		return "/article/article-list";
	}
	
	@RequestMapping(value = "listData")
	@ResponseBody
	public ReturnResult<DataPage<RecExpertColumnArticle>> listData(RecExpertColumnArticleQueryVo queryVo, DataPage<RecExpertColumnArticle> dataPage, 
			HttpServletRequest request) throws ParseException{
		logger.info("查询文章列表，queryVo={}", JSON.toJSONString(queryVo));
		try {
			RecExpert expert = getLoginExpert(request);
			if (expert==null) {
				return new ReturnResult<>(false, "未登录");
			}
			queryVo.setUserId(expert.getUserId());
			logger.info("查询文章列表，queryVo={}", JSON.toJSONString(queryVo));
			PageResult<RecExpertColumnArticle> pageResult = recExpertColumnArticleServiceClient.queryPage(queryVo, dataPage);
			if (!pageResult.isSuccess()) {
				return new ReturnResult<>(false, "接口返回错误");
			}
			return new ReturnResult<>(true, pageResult.getPage());
		} catch (Exception e) {
			logger.info("查询文章列表发生异常，queryVo={},发生异常exception={}", JSON.toJSONString(queryVo), e.getMessage(), e);
			return new ReturnResult<>(false, e.getMessage());
		}
	}
	
	@RequestMapping(value = "detail/{id}")
	public String detail(Model model, @PathVariable Long id){
		RecExpertColumnArticle article = recExpertColumnArticleServiceClient.queryById(id).getModel();
		model.addAttribute("article", article);
		if (StringUtils.isNotBlank(article.getContent())) {
			ExpertArticleContent cObj = JSONObject.parseObject(article.getContent(), ExpertArticleContent.class);
			model.addAttribute("cObj", cObj);
		}
		return "/article/article-show";
	}
	
}
