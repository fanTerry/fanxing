package com.esportzoo.esport.connect.response.quiz;

import com.esportzoo.quiz.constants.QuizMatchAllupEnable;
import com.esportzoo.quiz.constants.QuizMatchVisible;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;
import java.util.List;

/**
 * 竞猜赛事主要信息
 * @author tingjun.wang
 * @date 2019/10/22 19:25下午
 */
@Data
public class QuizMatchResponse implements Serializable {

	private static final long serialVersionUID = 2419813331008013632L;
	/**
	 * 赛事ID
	 */
	private Long matchId;
	/**
	 * 联赛id
	 */
	private Integer leagueId;
	/**
	 * 联赛名称
	 */
	private String leagueName;

	/**
	 * 赛制(多少场次/局)(彩易科思format)
	 */
	private Integer gameNumbers;

	/**
	 * 游戏id
	 */
	private Integer videogameId;
	/**
	 * 主队名称
	 */
	private String homeTeamName;
	private String homeTeamNameAbbr;

	/**
	 * 主队logo url
	 */
	private String homeTeamLogo;
	/**
	 * 客队名称
	 */
	private String awayTeamName;
	private String awayTeamNameAbbr;

	/**
	 * 客队logo url
	 */
	private String awayTeamLogo;

	/** 主队比分 */
	private Integer homeScore;

	/** 客队 */
	private Integer awayScore;
	/**
	 * 表示该场比赛是否会开滚球，等于1、3或者等于0，代表不会开滚球；如果grounder等于2，代表会开滚球；
	 */
	private Integer grounder;
	/**
	 * 是否支持串关 0：否 1：支持 {@link QuizMatchAllupEnable}
	 */
	private Integer allupEnable;

	/**
	 * 是否暂停投注 0：否 1：是 {@see QuizMatchSuspended}
	 */
	private Integer suspended;
	/**
	 * 是否显示状态 0：不显示 1：显示 {@link QuizMatchVisible}
	 */
	private Integer visible;

	/**
	 * 赛事状态 0：未开赛 1：赛中 2：完场 3：异常 4：取消 {@see QuizMatchStatus}
	 */
	private Integer matchStatus;

	/** 是否可以展示直播 */
	private Integer canLive = 0;

	/**
	 * 投注总用户数
	 */
	private Integer betUsers;

	/**
	 * 投注总次数
	 */
	private Integer betTimes;

	/**
	 * 比赛开始时间
	 */
	private Date startTime;

	/**
	 * 比赛结束时间
	 */
	private Date endTime;

	/**
	 * 截止投注时间
	 */
	private Date deadlineTime;

	/**
	 * 单一玩法数据
	 */
	private QuizMatchGameResponse quizMathGame;

	/**
	 * 更多竞猜没有数据时为 false
	 */
	private Boolean showMoreGame = true;

	/**
	 * 热点竞猜时前端样式展示类型
	 */
	private Integer showType;
	/**
	 * 热点竞猜前端展示所需要的图片
	 */
	private String backGroundImg;

	/** 直播源地址，多个地址*/
	List<String> liveVideoUrlList;

	/** 有直播源地址的情况下直播是否显示，0不显示，1显示，默认1
	 * @see com.esportzoo.quiz.constants.LiveVisibleStatus
	 * */
	private Integer liveVisible;

}
