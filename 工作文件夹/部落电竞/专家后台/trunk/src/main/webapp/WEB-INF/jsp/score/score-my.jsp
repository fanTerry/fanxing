<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta http-equiv="Cache-Control" content="no-cache"/>
<title>部落(海南)电竞</title>
<link href="" rel="shortcut icon" type="image/x-icon" />
<jsp:include page="/WEB-INF/commons/common-file.jsp"/>

<body class="admin_bg">
    <!-- 头部 -->
	<jsp:include page="/WEB-INF/commons/header.jsp"/>
	
    <div class="content clearfix">
        <!-- 左侧菜单 -->
		<jsp:include page="/WEB-INF/commons/left.jsp">
			<jsp:param name="menu" value="myscore"/>
		</jsp:include>
		
        <div class="aside">
            <div class="wrap1080 ppd70 fz14">
              <p class="pu_title bor_bot0">我的战绩</p>
                <div class="pub_list clearfix mt30" style="border-bottom:1px solid #eeeeee;padding-left:0;margin-left:30px;">
                    <ul class="rec_li clearfix" id="gameIdList">
                    		<li data-gameid="0" class="li_rect"><a href="javascript:void(0);">综合</a></li>
                      <c:if test="${qiuFlag == 1}">
                    	  	<li data-gameid="4075"><a href="javascript:void(0);">2串1</a></li>
                    	  	<li data-gameid="4171"><a href="javascript:void(0);">竞彩</a></li>
	                        <li data-gameid="4078"><a href="javascript:void(0);">亚盘</a></li>
	                        <li data-gameid="4079"><a href="javascript:void(0);">大小球</a></li>
	                        <li data-gameid="4051"><a href="javascript:void(0);">北单</a></li>
                    	</c:if>
                    	<c:if test="${qiuFlag == 2}">
                    	  	<li data-gameid="4065"><a href="javascript:void(0);">2串1</a></li>
                    	  	<li data-gameid="4061"><a href="javascript:void(0);">胜负</a></li>
	                        <li data-gameid="4062"><a href="javascript:void(0);">让分胜负</a></li>
	                        <li data-gameid="4063"><a href="javascript:void(0);">胜分差</a></li>
	                        <li data-gameid="4064"><a href="javascript:void(0);">大小分</a></li>
                    	</c:if>
                    </ul>
                    <div class="fr search_mbox clearfix c_999 fs12">注：战绩以玩法为单位统计
                    </div>                  
                </div>
              
                <!-- 列表 -->
                <div class="pl30 mt30 fb_table">
                    <table id="listContainer" width="100%">		
                	</table>
                </div>
                <div id="pageContainer"  class="paging clearfix">                      
                </div>          
            </div>        
        </div>
    </div>
    <input type="hidden" name="gameId" id="gameId">
    <input type="hidden" name="qiuFlag" id="qiuFlag" value="${qiuFlag}">      
    <!-- 尾部 -->
	<jsp:include page="/WEB-INF/commons/footer.jsp"/>
	
	<div id="dialog-alert" class="pub_success" style="display:none">
        <p style="font-size:15px;"">回报率=（返奖总金额-投入总金额）/单次投入金额*100%</p>
        <p >注：返奖总金额=单注奖金的总和    投入总金额=单注投入的总和</p>
        <p >单次投入金额即单注投入的金额，且以均注进行计算</p>
        <p >例：某专家推荐一场比赛竞彩胜平负、亚盘和大小球3个玩法</p>
        <p>最终回报如下：</p>
        <div><img src="/resources/images/hbl.png" height="150" width="400"></div>
    </div>
	
<script type="text/template" id="dot-list" charset="utf-8">
	<thead>
		<tr style="background-color:#dddddd">
			<th>时间</th>
			<th>发单数量</th>
            <th ><a href="javascript:;" id='mzl' class="addLinks">命中率 ?</a></th>
			<th ><a href="javascript:;" id='fjl' class="addLinks">返奖率 ?</a> </th>
			<th ><a href="javascript:;" id='hbl' class="addLinks">回报率 ?</a> </th>
		</tr>
	</thead>
	<tbody>
		{{? it.dataList.length < 1}}
			<tr><td align="center" colspan="4">暂无数据</td></tr>
		{{?}}
		{{~it.dataList :item:index}}
			<tr>
				<td>{{=item.period}}</td>
				<td>
					{{? item.period == '近M中N'}}
						{{=item.winCountIn7Dan}}
					{{?}}
					{{? item.period != '近M中N'}}
						发{{=item.openCount}}中{{=item.winCount}}
					{{?}}
				</td>
				<td>{{=item.formatWinRatio}}</td>
				<td {{? item.profitRatio >=1}}class="c_ea4747"{{?}} {{? item.profitRatio <1}}class="c_3bbb79"{{?}}>{{=item.formatProfitRatio}}</td>
				<td {{? item.returnRatio >=1}}class="c_ea4747"{{?}} {{? item.returnRatio <1}}class="c_3bbb79"{{?}}>{{=item.formatReturnRatio}}</td>
			</tr>
		{{~}}
	</tbody>
</script>

<script type="text/javascript" src="/resources/plugins/jquery.ui/1.11.4/jquery-ui.min.js"></script>
<script type="text/javascript" src="/resources/plugins/doT/doT.min.js"></script>
<script type="text/javascript" src="/resources/js/jiedu.page.js"></script>
<script type="text/javascript">
$(document).ready(function(){
	var jieduPage = $.fn.JieDuPage({
		url: "/score/myList"
	});
	var queryJieDu = function(){
		jieduPage.render({
			data : {
				gameId: $("#gameId").val(),
				qiuFlag: $("#qiuFlag").val()
			}
		});
	}
	//用第一个gameid赋值
	var gameId = $("#gameIdList li:first").attr("data-gameid");
	$("#gameId").val(gameId);
	
	queryJieDu();
	
	$("#gameIdList li").click(function(){
		$("#gameIdList li").removeClass("li_rect");
		$(this).addClass("li_rect");
		$("#gameId").val($(this).attr("data-gameid"));
		queryJieDu();
	});
	
	$(document).on("click","#mzl", function() {
		webAlert({title:"命中率规则", content:"命中率 = 命中单数/发单数*100% (注：一篇解读中出现N种玩法算N单)"});
	});
	$(document).on("click","#fjl", function() {
		webAlert({title:"返奖率规则", content:" 返奖率 =（返奖总金额-投入总金额）/投入总金额*100%  注：投入金额以均注计算"});
	});
	$(document).on("click","#hbl", function() {
		webAlert({title:"回报率规则", content:$("#dialog-alert")[0]});
	});
})
</script>
</body>
</html>
