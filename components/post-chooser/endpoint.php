<?php
/**
 * Adds a REST API endpoint to provide a posts matching the provided
 * search term and post types.
 *
 * The data returned matches the format expected by blocks using the
 * Post Chooser component.
 *
 * @link       www.bu.edu/interactive-design/
 * @since      0.1.0
 *
 * @package    BU_Blocks
 * @subpackage BU_Blocks/src/components/post-chooser
 */

namespace BU\Plugins\BU_Components\Post_Chooser\Search_Endpoint;

add_action( 'rest_api_init', __NAMESPACE__ . '\\register_route' );
add_filter( 'posts_search', __NAMESPACE__ . '\\search_by_title_only', 10, 2 );

/**
 * Register a REST API route for finding posts with the Post Chooser.
 */
function register_route() {
	register_rest_route(
		'acketon-components/v1',
		'search',
		array(
			'methods'  => 'GET',
			'callback' => __NAMESPACE__ . '\rest_response',
		)
	);
}



/**
 * Return posts based on the provided search term.
 *
 * @param \WP_Request $request The incoming REST API request object.
 * @return array Posts found using the provided parameters.
 */
function rest_response( $request ) {
	$post_id    = $request->get_param( 'post_id' );
	$post_types = $request->get_param( 'post_type' );
	$status     = $request->get_param( 'status' );
	$search     = $request->get_param( 'search' );
	$taxonomies = $request->get_param( 'taxonomies' );
	$meta       = $request->get_param( 'meta' );
	$image_size = ( $request->get_param( 'image_size' ) ) ? $request->get_param( 'image_size' ) : 'medium';
	$per_page   = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
	$title_only = $request->get_param( 'title_only' );

	// Provide at least an empty array if no post type is requested.
	if ( ! $post_types ) {
		$post_types = array();
	}

	// Default to publish if no status is passed.
	if ( ! $status ) {
		$status = array(
			'publish',
		);
	}

	// Set up the basic arguments for the query.
	$query_args = array(
		'post_type'              => $post_types,
		's'                      => $search,
		'post_status'            => $status,
		'posts_per_page'         => 20,
		'no_found_rows'          => true,
		'update_post_term_cache' => false,
		'update_post_meta_cache' => false,
		'fields'                 => 'ids',
	);

	if ( $search ) {
		$query_args['s'] = $search;
	} else {
		$query_args['posts_per_page'] = $per_page;
	}

	// Add a post ID argument if needed (for the post refresh feature).
	if ( $post_id ) {
		$query_args['p'] = absint( $post_id );
	}

	// Add taxonomy arguments if needed.
	if ( $taxonomies ) {
		foreach ( $taxonomies as $taxonomy => $terms ) {
			$query_args['tax_query'][] = array(
				'taxonomy' => $taxonomy,
				'terms'    => explode( ',', $terms ),
			);
		}
	}

	// Add meta query if needed.
	if ( $meta ) {
		$query_args['meta_query'] = $meta; // WPCS: slow query ok.
	}

	// Add `title_only` arg if needed.
	if ( $title_only ) {
		$query_args['title_only'] = true;
	}

	$query = new \WP_Query( $query_args );

	// Assume no posts match the criteria by default.
	$posts = array();

	if ( $query->have_posts() ) {
		while ( $query->have_posts() ) {
			$query->the_post();

			// Get featured image data for the post.
			$featured_image = ( ! has_post_thumbnail() ) ? false : array(
				'id'        => get_post_thumbnail_id(),
				'url'       => get_the_post_thumbnail_url( get_the_ID(), $image_size ),
				'alt'       => get_post_meta( get_post_thumbnail_id(), '_wp_attachment_image_alt', true ),
				'thumbnail' => get_the_post_thumbnail_url( get_the_ID() ),
			);

			// Get any other images attached to the post.
			$attachments     = array();
			$attached_images = get_attached_media( 'image' );

			if ( $attached_images ) {
				foreach ( $attached_images as $id => $data ) {
					$image = array(
						'id'        => $id,
						'url'       => wp_get_attachment_image_src( $id, $image_size )[0],
						'alt'       => get_post_meta( $id, '_wp_attachment_image_alt', true ),
						'thumbnail' => wp_get_attachment_thumb_url( $id ),
					);

					$attachments[] = $image;
				}
			}

			// Build out taxonomy and term data for the post.
			$taxonomies    = get_post_taxonomies( get_the_ID() );
			$post_taxonomy = array();

			foreach ( $taxonomies as $taxonomy ) {
				$tax_terms = array();
				$terms     = wp_get_post_terms( get_the_ID(), $taxonomy );

				foreach ( $terms as $term ) {
					$tax_terms[] = array(
						'id'   => $term->term_id,
						'name' => $term->name,
						'link' => get_term_link( $term->term_id, $taxonomy ),
						'slug' => $term->slug,
					);
				}

				$post_taxonomy[ $taxonomy ] = $tax_terms;
			}

			// Build out the array of post data to return.
			$post = array(
				'id'             => get_the_ID(),
				'type'           => get_post_type( get_the_ID() ),
				'title'          => get_the_title(),
				'date_gmt'       => get_the_date( '' ),
				'url'            => get_the_permalink(),
				'status'         => get_post_status(),
				'comment_count'  => wp_count_comments( get_the_ID() )->approved,
				'content'        => get_the_content(),
				'excerpt'        => get_the_excerpt(),
				'excerpt_clean'  => wp_strip_all_tags( get_the_excerpt(), true ),
				'featured_image' => $featured_image,
				'attached_media' => $attachments,
				//'content_images' => get_content_images( get_the_content(), $image_size ),
				'taxonomies'     => $post_taxonomy,
			);

			/**
			 * Filters the information attached to a post when included in a search result.
			 *
			 * @param array $post An array of information about post.
			 */
			$posts[] = apply_filters( 'bu_components_post_chooser_post_object', $post );
		}

		wp_reset_postdata();
	}

	return $posts;
}

/**
 * Filters the search SQL to matching against post title only.
 *
 * @param string   $search   Search SQL for WHERE clause.
 * @param WP_Query $wp_query The current WP_Query object.
 */
function search_by_title_only( $search, $wp_query ) {
	// Bail if the search statement, search query var, or title only query var is empty.
	if ( empty( $search ) || empty( $wp_query->query_vars['s'] ) || empty( $wp_query->query_vars['title_only'] ) ) {
		return $search;
	}

	global $wpdb;

	$n      = ! empty( $wp_query->query_vars['exact'] ) ? '' : '%';
	$search = array();

	foreach ( (array) $wp_query->query_vars['s'] as $term ) {
		$search[] = $wpdb->prepare( "($wpdb->posts.post_title LIKE %s)", $n . $wpdb->esc_like( $term ) . $n );
	}

	if ( ! is_user_logged_in() ) {
		$search[] = "($wpdb->posts.post_password = '')";
	}

	$search = ' AND ' . implode( ' AND ', $search );

	return $search;
}
