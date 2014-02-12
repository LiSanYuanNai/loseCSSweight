var http = require('http'),
    fs = require('fs');

http.createServer(function (req, res) {
	//post提交检测url
    if (req.method.toLowerCase() === 'post') {
    	var postData = '';
    	req.on("data", function(postDataChunk) {  // 有新的数据包到达就执行
	      postData += postDataChunk;
	    });

	    req.on("end", function() {  // 数据传输完毕
	    	var files = postData.split('------WebKitFormBound'); //第一个和最后一个要去除
	    	var files_num = files.length;
	    	var files_name = [];
	    	var reg = /filename=\"([^\"\s]+)\"/ig;  //从数据流里面将上传的文件名得到
	    	var css_num = postData.match(/name=\"name_css\"/).length;  //上传文件中css文件的数量
			while(r = reg.exec(postData)) {  
			    files_name.push(r[1]) ;  //r[0]是整个的匹配,r[1]是第一个分组
			}
			var html_name = files_name.slice(0, -css_num).join('\\n');  //将html文件名用换行符组合成字符串
			var direction_name = "../upload_" + (+new Date());
			//example: direction_name == ../upload_1385355692716
			fs.mkdirSync(direction_name);  //新建文件夹
			
	    	for(var i=1;i<(files_num-1);i++){
	    		if(i < files_num-1-css_num) { //如是是html文件
		    		var script = "<script src='../js/helium.js'></script><script>window.addEventListener('load', function(){helium.init();setTimeout(function(){if( document.querySelector('#cssdetectTextarea') ){document.querySelector('#cssdetectTextarea').innerHTML = '" + html_name + "';}},1000);},false);</script>";
		    		//在body结束前添加helium.js和初始化代码
			    	var file = files[i].replace(/(\/body>)/, '$1' + script);
			        fs.writeFile(direction_name + '/' + files_name[i-1], file, function(err) {
			              if(err)console.log(err);
			              else {
			                console.log('写入html成功')
			              }
			        });
	    		} else {
	    			fs.mkdirSync(direction_name + '/css');
	    			fs.writeFile(direction_name + '/css/' + files_name[i-1], files[i], function(err) {
			              if(err)console.log(err);
			              else {
			                console.log('写入css成功')
			              }
			        });
			        if(i == (files_num-2)) {  //如果是最后一个文件就要做返回和删除文件的处理
			        	//direction_name.substring(3) == upload_1385355692716
			        	var nginxroot = 'http://42.96.197.220/unuse_css/'; //这个跟后台的nginx或者apache配置有关
			        	var first_html = nginxroot + direction_name.substring(3) + '/' + files_name[0];

    					setTimeout(function() {
    						var exec = require('child_process').exec;
							exec('rm -rf ../upload_*', function(err,out) { 
							  err && console.log(err); 
							});
    					}, 600000);  //一分钟后将服务器上的文件夹删除，因为没有保留的必要

    					res.writeHead(302, {  //重定向到用户上传的第一个html文件，其实定向到任意一个html文件都可以，只是第一个肯定是html
						  'Location': first_html
						});
						res.end();
			        }
	    		}
	    		
	    	}
	    	
	    	
	    });

	    
    	
    } else {
		//无数据提交就访问首页
		//var pathname = url.parse(req.url).pathname;		
		res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.readFile('../index.html', function (err, data) {
            if (err) throw err;
            res.write(data);
            res.end();
        });
    }
}).listen(8889);

//nohup node /home/choi/nginxroot/unuse_css/js/index.js &  将nodejs常驻在服务器内存里面
//ps aux | grep node 

// jQuery.fn.simulateKeyPress = function(character) {  
//   // 内部调用jQuery.event.trigger  
//   // 参数有 (Event, data, elem). 最后一个参数是非常重要的的！  
//   jQuery(this).trigger({ type: 'keydown', which: character.charCodeAt(0) });  
// };
// setInterval(function() {
// 	$(document).simulateKeyPress('A');
// 	$(document).simulateKeyPress('S');
// },100);

//递归创建文件夹
//顺序是下面这样
// foo/bar/baz/asdf/quux
// foo/bar/baz/asdf
// foo/bar/baz
// foo/bar
// foo
//      从这递归回去
// function mkdirs(dirpath, mode, callback) { //这里的callback就是下面fs.mkdir(dirpath, mode, callback)
// 	fs.exists(dirpath, function(exists) {
// 		if(exists) {
// 			callback(dirpath)
// 		} else {
// 			mkdirs(path.dirname(dirpath), mode, function() {
// 				fs.mkdir(dirpath, mode, callback)
// 			})
// 		}
// 	})
// }