var formidable = require('formidable'),
	AWS = require('aws-sdk'),
	Upload = {};

AWS.config.region = 'ap-northeast-2';
const s3 = new AWS.S3({
	accessKeyId: "",
	secretAccessKey:""
});
var form = new formidable.IncomingForm({
	encoding: 'utf-8',
	multiples: true,
	keepExtensions: false
});

//S3 버킷 설정
var params = {
	Bucket: 'fleeflow',
	Key: null,
	ACL: 'public-read',
	Body: null,
	ContentType:'image/png'
}

Upload.formidable = function(req, callback){
	form.parse(req, function(err, fields, files){
		callback(err, fields, files);
	});
	// form.on('error', function(err){
	// 	callback(err, null);
	// });
	// form.on('end', function(){
	// 	callback(null, files, fields);
	// });
	// form.on('aborted', function(){
	// 	callback('form.on(aborted)', null);
	// });
};



Upload.s3 = function(req, files, callback){
	params.Key = 'chatrooms/messages/images/'+req.user+Date.now();
	params.Body = require('fs').createReadStream(files.img_file.path);
	s3.upload(params, function(err,result){
		callback(err, params.Key);
	});
}

Upload.s3profile = function(req, files, callback){
	params.Key = 'profile/'+req.user+Date.now();
	params.Body = require('fs').createReadStream(files.img_file.path);
	s3.upload(params, function(err,result){
		callback(err, params.Key);
	});
}

module.exports = Upload;
