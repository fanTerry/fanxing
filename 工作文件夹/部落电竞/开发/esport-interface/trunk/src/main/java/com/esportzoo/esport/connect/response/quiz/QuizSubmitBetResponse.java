package com.esportzoo.esport.connect.response.quiz;

import lombok.Data;

import java.io.Serializable;

/**
 * 竞猜提交投注返回信息
 * 
 * @author jing.wu
 * @version 创建时间：2019年10月24日 下午5:48:12
 */
@Data
public class QuizSubmitBetResponse implements Serializable {

	private static final long serialVersionUID = -4992275490825503987L;
	/** 当前竞猜订单表id */
	private Long betOrderId;

	private boolean isFirstGuess = false;

	/** quiz_plan 状态 */
	private Integer quizPlanStatus;


}
