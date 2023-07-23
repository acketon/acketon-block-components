/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/packages/packages-block-editor/#useBlockProps
 */
import { useBlockProps } from '@wordpress/block-editor';

import { Fragment } from '@wordpress/element';


import { PostChooser, PostChooserAttributes } from 'acketon-block-components';


/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/developers/block-api/block-edit-save/#edit
 *
 * @return {WPElement} Element to render.
 */
export default function Edit( props ) {
	console.log(props);
	// Get the block properties.
	const {
		attributes,
		setAttributes,
	} = props;

	// Get the block attributes.
	const {
		featuredPostID,
		postChooserPostID,
		postChooserPostTitle,
		postChooserPostExcerpt,
	} = attributes;

	let selectedPostObject = false;

	console.log( attributes );

	return (
		<div className='example-featured-post-block'>
			<p { ...useBlockProps() }>
				{ __(
					'Example Components – hello from the editor!',
					'examplecomponents'
				) }
			</p>
			
			<figure>
				{ postChooserPostID && 
					<img src="" />
				}
				{ ! postChooserPostID && 
					<PostChooser
						label="Choose Wisely"
						buttonLabel="Choose..."
						placeholder="Pick something..."
						onSelectPost={ (post) => { 
								//console.log(post);
								//selectedPostObject = post;
								//console.log(selectedPostObject);
								//setAttributes( { featuredPostID: post.id } )
							} 
						}
						setAttributes={ setAttributes }
					/>
				}
			</figure>
			<div className='example-featured-post-block-content'>
				{console.log(selectedPostObject)}
				{ ! postChooserPostID && 
					<Fragment>
						<h2>Select a Post</h2>
						<p>Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Aenean lacinia bibendum nulla sed consectetur.</p>
					</Fragment>
				}
				{ postChooserPostID && 
					<Fragment>
						{console.log(postChooserPostID)}
						<h2>{ postChooserPostTitle }</h2>
						<p>{ postChooserPostExcerpt }</p>
					</Fragment>
				}

			</div>
			
			
		</div>
	);
}
