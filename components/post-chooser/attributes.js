/**
 * The post chooser component attributes.
 */

const PostChooserAttributes = {
	postChooserPostID: {
		type: 'number',
	},
	postChooserPostType: {
		type: 'string',
	},
	postChooserPostTitle: {
		type: 'string',
	},
	postChooserPostExcerpt: {
		type: 'string',
	},
	postChooserPostThumbnail: {
		type: 'boolean',
		default: false,
	},
	postChooserPostImageID: {
		type: 'number',
	},
	postChooserPostImageURL: {
		type: 'string',
	},
	postChooserPostImageAlt: {
		type: 'string',
	},
};

export default PostChooserAttributes;