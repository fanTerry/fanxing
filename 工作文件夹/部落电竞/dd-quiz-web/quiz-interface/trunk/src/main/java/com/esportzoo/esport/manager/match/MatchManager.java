package com.esportzoo.esport.manager.match;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import cn.hutool.core.date.DateUtil;

import com.esportzoo.common.appmodel.domain.result.ModelResult;
import com.esportzoo.esport.connect.response.expert.MatchVo;
import com.esportzoo.esport.util.Application;
import com.esportzoo.leaguelib.client.service.postmatch.LeagueServiceClient;
import com.esportzoo.leaguelib.client.service.prematch.MatchServiceClient;
import com.esportzoo.leaguelib.common.constants.MatchStatus;
import com.esportzoo.leaguelib.common.domain.League;
import com.esportzoo.leaguelib.common.domain.Match;
import com.google.common.collect.Lists;

/**
 * @author tingting.shen
 * @date 2019/05/10
 */
@Component
public class MatchManager {
	
	private transient static final Logger logger = LoggerFactory.getLogger(MatchManager.class);
	
	@Autowired
	@Qualifier("matchServiceClient")
	MatchServiceClient matchServiceClient;

	@Autowired
	@Qualifier("leagueServiceClient")
	LeagueServiceClient leagueServiceClient;

	@Autowired
	private Application application;
	
	public List<Match> getMatchList(List<Long> matchIds) {
		ModelResult<List<Match>> modelResult = matchServiceClient.queryMatchListByMatchIds(matchIds);
		if (!modelResult.isSuccess()) {
			logger.info("根据matchIds获取比赛信息，调用接口返回错误，errMsg={}", modelResult.getErrorMsg());
			return null;
		}
		return modelResult.getModel();
	}
	
	public List<Match> getMatchListByMatchStr(String matchStr) {
		if (StringUtils.isBlank(matchStr)) {
			return null;
		}
		String[] ids = matchStr.split(",");
		if (ids.length <=0) {
			return null;
		}
		List<Long> idList = Lists.newArrayList();
		for (String matchId : ids) {
			if (StringUtils.isNotBlank(matchId)) {
				idList.add(Long.valueOf(matchId.trim()));
			}
		}
		return this.getMatchList(idList);	
	}
	
	public List<MatchVo> getMatchVoListByMatchStr(String matchStr) {
		List<Match> matchList = this.getMatchListByMatchStr(matchStr);
		if (matchList==null || matchList.size()<=0) {
			return null;
		}
		List<MatchVo> matchVoList = new ArrayList<>();
		for (Match match : matchList) {
			MatchVo matchVo = new MatchVo();
			ModelResult<League> modelResult = leagueServiceClient.queryByLeagueId(match.getLeagueId());
			if (modelResult.isSuccess() && modelResult.getModel()!=null){
				if (StringUtils.isNotBlank(modelResult.getModel().getName())) {
					matchVo.setLeagueName(modelResult.getModel().getName()+" BO"+match.getNumberOfGames());
				}
			}
			MatchStatus matchStatus = MatchStatus.valueOf(match.getStatus());
			if (matchStatus!=null){
				matchVo.setStatusDescription(matchStatus.getDescription());
			}
			matchVo.setMatchId(match.getMatchId());
			matchVo.setHomeTeamId(match.getHomeTeamId());
			matchVo.setHomeTeamName(match.getHomeTeamName());
			matchVo.setHomeTeamLogo(application.getMatchHomeTeamLogo(match));
			matchVo.setAwayTeamId(match.getAwayTeamId());
			matchVo.setAwayTeamLogo(application.getMatchAwayTeamLogo(match));
			matchVo.setAwayTeamName(match.getAwayTeamName());
			String [] strings = new String[2];
			strings[0] = DateUtil.format(match.getBeginAt(),"MM-dd");
			strings[1] = DateUtil.format(match.getBeginAt(),"HH:mm");
			matchVo.setMatchTime(strings);
			matchVoList.add(matchVo);

		}
		return matchVoList;
	}

	
}
