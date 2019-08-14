(function() {
	function initOutput(imgW,imgH){
		$('#output').remove();
		$('#outputdiv').append("<canvas id='output' ></canvas>");
		$('#output').attr('width',imgW);
		$('#output').attr('height',imgH);	
	}

	function initWave(imgW,imgH){
		$('#wave').remove();
		$('#wavediv').append("<canvas id='wave' ></canvas>");
		$('#wave').attr('width',imgW);
		$('#wave').attr('height',imgH);	
	}

	function initProcessing(imgW,imgH){
		$('#processing').remove();
		$('#processingdiv').append("<canvas id='processing' ></canvas>");
		$('#processing').attr('width',imgW);
		$('#processing').attr('height',imgH);	
	}		

	function showWave(wave,average){
		initWave(700,500);
		var label=[];
		label[0]='0';
		label[wave.length-1]='180';
		var data = {
			labels: label,
			datasets: [
				{
					label: "wave",
					backgroundColor: 'rgba(0, 0, 0, 1)',
					data: wave
				},
				{
					label: "average",
					backgroundColor: 'rgba(255, 0, 0, 1)',
					data: [average]
				}
			]
		};
		var m = document.getElementById('wave');
		ctx= m.getContext('2d');		
		var myBarChart = new Chart(ctx, {
			type: 'bar',
			data: data
		});
		$('#wave').css('display','');
	}
	c=null;
	var r;
	var img;
	imgW=0, imgH=0;
	var gaussianEnergy = 50;
	var videoBtnState = 'stop';
	var autoFingerCounting;
	window.onload = function(){
		//init
		var canvas = document.getElementById("input");
		var ctx = canvas.getContext("2d");
		ctx.font = "30px Arial";
		ctx.fillText("please input image",25,80);
		var canvas = document.getElementById("output");
		var ctx = canvas.getContext("2d");
		ctx.font = "30px Arial";
		ctx.fillText("please input image",25,80);	

		
		$('#processingdiv').hide();
		$('#wavediv').hide();
		$('button').click(function(){
			$('#processingdiv').hide();
			$('#wavediv').hide();
		});
	
		//Output image file
		function download() {
			var canvas = document.getElementById('output');
			var dt = canvas.toDataURL('image/bmp');
			this.href = dt;
		};
		downloadLnk.addEventListener('click', download, false);	

		//rgb2gray
		$('#gray').click(function(){
			initOutput(imgW,imgH);
			var m = document.getElementById('output');
			d= m.getContext('2d');
			var s = c.getImageData(0,0,imgW,imgH);
			r = d.createImageData(imgW,imgH);
			for(var i=0;i<imgH;i++){
				for(var j=0;j<imgW;j++){
				var k = (imgW*i+j)*4;
					temp = (s.data[k]+s.data[k+1]+s.data[k+2])/3
					r.data[k] = temp;
					r.data[k+1] = temp;
					r.data[k+2] = temp;
					r.data[k+3] = 255;
				}
			}
			d.putImageData(r,0,0);			
		});
		
		//HOG
		$('#HOG').click(function(){
			initOutput(700,500);
			var hog = [];
			var label=[];
			color = [];
			label[0]=0;
			label[255]=255;
			for(var i=0;i<256;i++){
				color[i] = 'rgba(0, 0, 0, 1)';
				hog[i]=0;
			}
			var s = c.getImageData(0,0,imgW,imgH);
			for(var i=0;i<imgH;i++){
				for(var j=0;j<imgW;j++){
				var k = (imgW*i+j)*4;
					temp = (s.data[k]+s.data[k+1]+s.data[k+2])/3
					hog[Math.floor(temp)]+=1;
				}
			}
			var data = {
				labels: label,
				datasets: [
					{
						label: "Histogram",
						backgroundColor: color,
						data: hog,
					}
				]
			};
			var m = document.getElementById('output');
			ctx= m.getContext('2d');			
			var myBarChart = new Chart(ctx, {
				type: 'bar',
				data: data
			});
			$('#output').css('display','');
		});
		
		//Gaussian noise
		function gaussian(x,mean,variance){
			return (1/Math.sqrt(2*Math.PI*variance))*Math.exp(-Math.pow(x-mean,2)/(2*variance));
		}
		function gaussianNoise(variance){
			if(typeof variance === "undefined") variance = 1.0;

			var rand1 = Math.random();
			rand1 = -2 * Math.log(rand1);

			var rand2 = Math.random();
			rand2 = 2 * Math.PI * rand2;
			return Math.sqrt(rand1 * variance) * Math.cos(rand2);
			 
		}

		$('#gaussian_noise').click(function(){	
			initOutput(imgW,imgH);
			var m = document.getElementById('output');
			d= m.getContext('2d');
			var s = c.getImageData(0,0,imgW,imgH);
			r = d.createImageData(imgW,imgH);
			for(var i=0;i<imgH;i++){
				for(var j=0;j<imgW;j++){
					var k = (imgW*i+j)*4;
					temp = (s.data[k]+s.data[k+1]+s.data[k+2])/3
					noise = gaussianNoise(parseFloat($('#variance').val()));
					r.data[k] = gaussianEnergy*noise+temp;
					r.data[k+1] = gaussianEnergy*noise+temp;
					r.data[k+2] = gaussianEnergy*noise+temp;
					r.data[k+3] = 255;
				}
			}
			d.putImageData(r,0,0);
		});
		
		//gHOG
		$('#gHOG').click(function(){
			initOutput(700,500);
			var hog = [];
			var label=[];
			color = [];
			label[0]=-1;
			label[200]=1;
			for(var i=0;i<200;i++){
				color[i] = 'rgba(0, 0, 0, 1)';
				hog[i]=0;
			}
			for(var i=0;i<imgH*imgW;i++){
				noise = gaussianNoise(parseFloat($('#variance').val()));
				hog[Math.floor(noise*100)+100]+=1;
			}
			for(var i=0;i<200;i++){
				hog[i]=hog[i]/(imgH*imgW);
			}
			var data = {
				labels: label,
				datasets: [
					{
						label: "Histogram",
						backgroundColor: color,
						data: hog,
					}
				]
			};
			var m = document.getElementById('output');
			ctx= m.getContext('2d');			
			var myBarChart = new Chart(ctx, {
				type: 'bar',
				data: data
			});
			$('#output').css('display','');
		});

		//RGBTransform
		$('#RGBTransform').click(function(){	
			initOutput(imgW,imgH);
			var m = document.getElementById('output');
			d= m.getContext('2d');
			var s = c.getImageData(0,0,imgW,imgH);
			r=[]
			r[0] = d.createImageData(imgW/2,imgH/2);
			r[1] = d.createImageData(imgW/2,imgH/2);
			r[2] = d.createImageData(imgW/2,imgH/2);
			r[3] = d.createImageData(imgW/2,imgH/2);
			var k = 0;
			for(var i=0;i<imgH;i+=2){
				for(var j=0;j<imgW;j+=2){
					var l = (imgW*i+j)*4;
					temp = (s.data[l]+s.data[l+1]+s.data[l+2])/3
					r[0].data[k] = temp;
					r[0].data[k+1] = temp;
					r[0].data[k+2] = temp;
					r[0].data[k+3] = 255;
					r[1].data[k] = s.data[l];
					r[1].data[k+1] = s.data[l];
					r[1].data[k+2] = s.data[l];
					r[1].data[k+3] = 255;
					r[2].data[k] = s.data[l+1];
					r[2].data[k+1] = s.data[l+1];
					r[2].data[k+2] = s.data[l+1];
					r[2].data[k+3] = 255;
					r[3].data[k] = s.data[l+2];
					r[3].data[k+1] = s.data[l+2];
					r[3].data[k+2] = s.data[l+2];
					r[3].data[k+3] = 255;					
					k+=4;
				}
			}
			d.putImageData(r[0],0,0);
			d.putImageData(r[1],imgW/2,0);
			d.putImageData(r[2],0,imgH/2);
			d.putImageData(r[3],imgW/2,imgH/2);
		});
		
		//CMYKTransform
		$('#CMYKTransform').click(function(){	
			initOutput(imgW,imgH);
			var m = document.getElementById('output');
			d= m.getContext('2d');
			var s = c.getImageData(0,0,imgW,imgH);
			r=[]
			r[0] = d.createImageData(imgW/2,imgH/2);
			r[1] = d.createImageData(imgW/2,imgH/2);
			r[2] = d.createImageData(imgW/2,imgH/2);
			r[3] = d.createImageData(imgW/2,imgH/2);
			var k = 0;
			for(var i=0;i<imgH;i+=2){
				for(var j=0;j<imgW;j+=2){
					var l = (imgW*i+j)*4;
					Rp = s.data[l]/255;
					Gp = s.data[l+1]/255;
					Bp = s.data[l+2]/255;
					K = 1 - Math.max(Rp,Gp,Bp);
					C = (1-Rp-K)/(1-K);
					M = (1-Gp-K)/(1-K);
					Y = (1-Bp-K)/(1-K);
					temp = (C+M+Y)/3*255;
					r[0].data[k] = temp;
					r[0].data[k+1] = temp;
					r[0].data[k+2] = temp;
					r[0].data[k+3] = 255;
					r[1].data[k] = C*255;
					r[1].data[k+1] = C*255;
					r[1].data[k+2] = C*255;
					r[1].data[k+3] = 255;
					r[2].data[k] = M*255;
					r[2].data[k+1] = M*255;
					r[2].data[k+2] = M*255;
					r[2].data[k+3] = 255;
					r[3].data[k] = Y*255;
					r[3].data[k+1] = Y*255;
					r[3].data[k+2] = Y*255;
					r[3].data[k+3] = 255;					
					k+=4;
				}
			}
			d.putImageData(r[0],0,0);
			d.putImageData(r[1],imgW/2,0);
			d.putImageData(r[2],0,imgH/2);
			d.putImageData(r[3],imgW/2,imgH/2);
		});

		//膚色偵測
		$('#extractSkin').click(function(){
			initOutput(imgW,imgH);
			var m = document.getElementById('output');
			d= m.getContext('2d');
			var s = c.getImageData(0,0,imgW,imgH);
			r = d.createImageData(imgW,imgH);
			for(var i=0;i<imgH;i++){
				for(var j=0;j<imgW;j++){
				var k = (imgW*i+j)*4;
					R = s.data[k];
					G = s.data[k+1];
					B = s.data[k+2];
					Cr = 0.5000*R - 0.4187*G - 0.0813*B + 128 ;
					if(Cr>=140 && Cr<=160){
						r.data[k] = 255;
						r.data[k+1] = 255;
						r.data[k+2] = 255;						
					}
					else{
						r.data[k] = 0;
						r.data[k+1] = 0;
						r.data[k+2] = 0;					
					}

					r.data[k+3] = 255;
				}
			}
			d.putImageData(r,0,0);			
		});
		
		//histogram equalization image
		$('#equalization').click(function(){
			initOutput(imgW,imgH);
			var hog = [];
			var label=[];
			for(var i=0;i<256;i++){
				hog[i]=0;
			}
			var s = c.getImageData(0,0,imgW,imgH);
			for(var i=0;i<imgH;i++){
				for(var j=0;j<imgW;j++){
				var k = (imgW*i+j)*4;
					temp = (s.data[k]+s.data[k+1]+s.data[k+2])/3
					hog[Math.floor(temp)]+=1;
				}
			}
			cdf=[];
			cdf[0]=hog[0];
			hv = [];
			min=0;
			for(var i=1;i<256;i++){
				cdf[i] = cdf[i-1]+hog[i];
				if(cdf[i]!=0 && min==0)min=cdf[i];
				hv[i] = Math.round(((cdf[i]-min)/(imgH*imgW))*255)
			}
			var m = document.getElementById('output');
			d= m.getContext('2d');
			var s = c.getImageData(0,0,imgW,imgH);
			r = d.createImageData(imgW,imgH);
			for(var i=0;i<imgH;i++){
				for(var j=0;j<imgW;j++){
				var k = (imgW*i+j)*4;
					temp = Math.floor((s.data[k]+s.data[k+1]+s.data[k+2])/3)
					r.data[k] = hv[temp];
					r.data[k+1] = hv[temp];
					r.data[k+2] = hv[temp];
					r.data[k+3] = 255;
				}
			}
			d.putImageData(r,0,0);
		});
		//histogram equalization hog
		$('#equalizationHOG').click(function(){
			initOutput(700,500);
			var hog = [];
			var label=[];
			color = [];
			label[0]=0;
			label[255]=255;
			for(var i=0;i<256;i++){
				color[i] = 'rgba(0, 0, 0, 1)';
				hog[i]=0;
			}
			var s = c.getImageData(0,0,imgW,imgH);
			for(var i=0;i<imgH;i++){
				for(var j=0;j<imgW;j++){
				var k = (imgW*i+j)*4;
					temp = (s.data[k]+s.data[k+1]+s.data[k+2])/3
					hog[Math.floor(temp)]+=1;
				}
			}
			cdf=[];
			cdf[0]=hog[0];
			hv = [];
			min=0;
			for(var i=1;i<256;i++){
				cdf[i] = cdf[i-1]+hog[i];
				if(cdf[i]!=0 && min==0)min=cdf[i];
				hv[i] = Math.round(((cdf[i]-min)/(imgH*imgW))*255)
			}
			newhog = [];
			for(var i=0;i<256;i++){
				newhog[i]=0;
			}
			for(var i=0;i<imgH;i++){
				for(var j=0;j<imgW;j++){
				var k = (imgW*i+j)*4;
					temp = Math.floor((s.data[k]+s.data[k+1]+s.data[k+2])/3)
					newhog[hv[temp]]+=1;
				}
			}			
			var data = {
				labels: label,
				datasets: [
					{
						label: "Histogram",
						backgroundColor: color,
						data: newhog,
					}
				]
			};
			var m = document.getElementById('output');
			ctx= m.getContext('2d');			
			var myBarChart = new Chart(ctx, {
				type: 'bar',
				data: data
			});
			$('#output').css('display','');		
		});
		
		//edge detection
		$('#edge').click(function(){
			initOutput(imgW,imgH);
			var m = document.getElementById('output');
			d= m.getContext('2d');
			var s = c.getImageData(0,0,imgW,imgH);
			r = d.createImageData(imgW,imgH);
			imageMatrix = Array(imgH+2);
			new_imageMatrix = Array(imgH+2);
			for(var i=0;i<imgH+2;i++){
				imageMatrix[i] = Array(imgW+2);
				new_imageMatrix[i] = Array(imgW+2);
				for (j=0;j<imgW+2;j++){
					imageMatrix[i][j]=0;
					new_imageMatrix[i][j]=0;
				}
			}
			for(var i=0;i<imgH;i++){
				for(var j=0;j<imgW;j++){
					var k = (imgW*i+j)*4;
					imageMatrix[i+1][j+1] = (s.data[k]+s.data[k+1]+s.data[k+2])/3;
				}
			}
			var mask=[];
			switch($('#mask').val()) {
				case 'E1':
					mask = [
					[1,0,-1],
					[0,0,0],
					[-1,0,1]
					];					
					break;
				case 'E2':
					mask = [
					[0,1,0],
					[1,-4,1],
					[0,1,0]
					];
					break;
				case 'E3':
					mask = [
					[-1,-1,-1],
					[-1,8,-1],
					[-1,-1,-1]
					];
					break;
				case 'S1':
					mask = [
					[1/9,1/9,1/9],
					[1/9,1/9,1/9],
					[1/9,1/9,1/9]
					];
					break;
				case 'S2':
					mask = [
					[1/16,2/16,1/16],
					[2/16,4/16,2/16],
					[1/16,2/16,1/16]
					];	
					break;
				default:
					break;
			}					
			for(var i=1;i<=imgH;i++){
				for(var j=1;j<=imgW;j++){
					for(var k=-1;k<=1;k++){
						for(var l=-1;l<=1;l++){
							new_imageMatrix[i][j] += imageMatrix[i+k][j+l]*mask[k+1][l+1];
						}
					}
				}
			}
			for(var i=0;i<imgH;i++){
				for(var j=0;j<imgW;j++){
					var k = (imgW*i+j)*4;
					temp=new_imageMatrix[i+1][j+1];
					r.data[k] = temp;
					r.data[k+1] = temp;
					r.data[k+2] = temp;
					r.data[k+3] = 255;
				}
			}
			d.putImageData(r,0,0);
		});
		//smoothing
		$('#gray').click(function(){
			initOutput(imgW,imgH);
			var m = document.getElementById('output');
			d= m.getContext('2d');
			var s = c.getImageData(0,0,imgW,imgH);
			r = d.createImageData(imgW,imgH);
			for(var i=0;i<imgH;i++){
				for(var j=0;j<imgW;j++){
				var k = (imgW*i+j)*4;
					temp = (s.data[k]+s.data[k+1]+s.data[k+2])/3
					r.data[k] = temp;
					r.data[k+1] = temp;
					r.data[k+2] = temp;
					r.data[k+3] = 255;
				}
			}
			d.putImageData(r,0,0);			
		});		
		
		//Finger Counting
		$('#gesture').click(function(){
			$('#processingdiv').show();
			$('#wavediv').show();
			initProcessing(imgW,imgH);
			initOutput(150,150);
			var m = document.getElementById('processing');
			d= m.getContext('2d');
			var s = c.getImageData(0,0,imgW,imgH);
			r = d.createImageData(imgW,imgH);

			var predict_number, wave, average
			[predict_number, wave, average] = fingerCount(s, r)

			//show processing image
			d.putImageData(r,0,0);
			
			//show wave
			initWave(700,500);
			var label=[];
			label[0]='0';
			label[wave.length-1]='180';
			var data = {
				labels: label,
				datasets: [
					{
						label: "wave",
						backgroundColor: 'rgba(0, 0, 0, 1)',
						data: wave
					},
					{
						label: "average",
						backgroundColor: 'rgba(255, 0, 0, 1)',
						data: [average]
					}
				]
			};
			var m = document.getElementById('wave');
			ctx= m.getContext('2d');		
			var myBarChart = new Chart(ctx, {
				type: 'bar',
				data: data
			});
			$('#wave').css('display','');	
			
			var m1 = document.getElementById('output');
			var ctx1 = m1.getContext("2d");
			ctx1.clearRect(0, 0, m1.width, m1.height);
			ctx1.font = "100px Arial";
			ctx1.fillText(""+predict_number,50,115);
		});

		// Video
		video = document.getElementById('video');
		startbutton = document.getElementById('startbutton');
		navigator.mediaDevices.getUserMedia({video: true, audio: false})
		.then(function(stream) {
		  video.srcObject = stream;
		  video.play();
		})
		.catch(function(err) {
		  console.log("An error occurred: " + err);
		});
		startbutton.addEventListener('click', function(ev){
			// var m = document.getElementById('input');
			// c = m.getContext('2d');
			// m.width = video.videoWidth;
			// m.height = video.videoHeight;
			// c.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
			// imgH = m.height;
			// imgW = m.width;
			// ev.preventDefault();
			
			//auto finger counting in video
			if(videoBtnState=='stop'){
				autoFingerCounting = setInterval(function(){
					$('#processingdiv').show();
					$('#wavediv').show();
					initProcessing(imgW,imgH);
					initOutput(150,150);				
					var m = document.getElementById('input');
					c = m.getContext('2d');
					m.width = video.videoWidth;
					m.height = video.videoHeight;
					c.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
					imgH = m.height;
					imgW = m.width;

					var m = document.getElementById('processing');
					d= m.getContext('2d');
					var s = c.getImageData(0,0,imgW,imgH);
					r = d.createImageData(imgW,imgH);

					var predict_number, wave, average
					[predict_number, wave, average] = fingerCount(s, r)

					//show processing image
					d.putImageData(r,0,0);

					//show wave
					showWave(wave, average)					


					
					var m1 = document.getElementById('output');
					var ctx1 = m1.getContext("2d");
					ctx1.clearRect(0, 0, m1.width, m1.height);
					ctx1.font = "100px Arial";
					ctx1.fillText(""+predict_number,50,115);			
				},1000);
				videoBtnState='running';			
			}
			else{
				clearInterval(autoFingerCounting);
				videoBtnState='stop';
			}
						
		}, false);


	}


    $("#uploadImage").change(function(){
      readImage( this );
    });
 
    function readImage(input) {
      if ( input.files && input.files[0] ) {
        var FR= new FileReader();
        FR.onload = function(e) {
			var m = document.getElementById('input');
			c = m.getContext('2d');
			img = new Image();
			img.src = e.target.result;
			img.onload = function(){
				imgH = img.height;
				imgW = img.width;
				$('#input').attr('width',imgW)
				$('#input').attr('height',imgH)
				$('#output').attr('width',imgW)
				$('#output').attr('height',imgH)				
				c.drawImage(img,0,0);
			}		  
        };       
        FR.readAsDataURL( input.files[0] );
      }
	  
    }
})();